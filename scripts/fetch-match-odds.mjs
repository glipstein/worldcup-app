#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/fetch-match-odds.mjs
//
// Fetches Polymarket prediction-market odds for every WC 2026 fixture and
// writes src/lib/matchOdds.ts with MATCH_ODDS keyed by "HOMEABBR_AWAYABBR".
//
// Run manually:   node scripts/fetch-match-odds.mjs
// In CI:          unconditional step in .github/workflows/auto-update-strengths.yml
//                 (runs every 6 hours regardless of whether Elo updated)
//
// Flow:
//   1. Pull the full match schedule from the ESPN scoreboard API (week by week
//      across the full WC 2026 window so we always catch all 104 fixtures).
//   2. For each match, construct the Polymarket gamma event slug.
//   3. Fetch odds; normalize to sum to 1.0; store under ESPN key.
//   4. Write src/lib/matchOdds.ts.  If ESPN returns no matches at all
//      (e.g. off-season test run), bail without overwriting existing data.
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = join(__dirname, '..');
const OUT_PATH   = join(ROOT, 'src/lib/matchOdds.ts');

// ── ESPN → Polymarket team-code mapping ──────────────────────────────────────
// Polymarket uses FIFA/IOC alpha codes that sometimes differ from ESPN's abbrs.
// For any ESPN code NOT listed here, we fall back to simple `.toLowerCase()`.
const ESPN_TO_PM = {
  SUI: 'che',  // Switzerland (Confoederatio Helvetica)
  NED: 'nld',  // Netherlands
  KOR: 'kr',   // South Korea
  CPV: 'cvi',  // Cape Verde
  URU: 'ury',  // Uruguay
  // Entries below are "same after lowercase" but listed for clarity:
  KSA: 'ksa',  // Saudi Arabia (ESPN also uses SAU sometimes)
  SAU: 'ksa',
};

function toPM(espnAbbr) {
  return ESPN_TO_PM[espnAbbr] ?? espnAbbr.toLowerCase();
}

// ── Tournament date windows (week-by-week for reliable ESPN pagination) ───────
// WC 2026: June 11 – July 19 2026  (104 total matches)
const WEEKS = [
  ['20260611', '20260617'],
  ['20260618', '20260624'],
  ['20260625', '20260701'],
  ['20260702', '20260708'],
  ['20260709', '20260715'],
  ['20260716', '20260719'],
];

const ESPN_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

async function fetchESPNMatches() {
  const seen = new Set();
  const matches = [];

  for (const [from, to] of WEEKS) {
    const url = `${ESPN_BASE}?dates=${from}-${to}&limit=100`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        console.warn(`  ESPN ${from}-${to}: HTTP ${res.status} — skipping`);
        continue;
      }
      const data = await res.json();
      const events = data.events ?? [];

      for (const ev of events) {
        const id = ev.id;
        if (seen.has(id)) continue;
        seen.add(id);

        const comp   = ev.competitions?.[0];
        if (!comp) continue;
        const home   = comp.competitors?.find(c => c.homeAway === 'home');
        const away   = comp.competitors?.find(c => c.homeAway === 'away');
        if (!home?.team?.abbreviation || !away?.team?.abbreviation) continue;

        const homeAbbr = home.team.abbreviation.toUpperCase().trim();
        const awayAbbr = away.team.abbreviation.toUpperCase().trim();
        const date     = ev.date?.slice(0, 10); // "YYYY-MM-DD"
        if (!date) continue;

        matches.push({ homeAbbr, awayAbbr, date });
      }
      console.log(`  ESPN ${from}-${to}: ${events.length} events`);
    } catch (e) {
      console.warn(`  ESPN ${from}-${to}: error — ${e.message}`);
    }
    await sleep(120); // polite gap between ESPN calls
  }

  return matches;
}

// ── Polymarket fetch ──────────────────────────────────────────────────────────

const PM_BASE = 'https://gamma-api.polymarket.com/events';

/**
 * Polymarket stores outcomePrices as either a real array OR a JSON-encoded
 * string (e.g. "[\"0.685\", \"0.315\"]").  This helper normalises both.
 */
function getOutcomePrice(outcomePrices) {
  if (!outcomePrices) return NaN;
  const arr = typeof outcomePrices === 'string'
    ? JSON.parse(outcomePrices)
    : outcomePrices;
  return parseFloat(arr?.[0] ?? '');
}

/**
 * Try one Polymarket event slug.
 * Returns { pHome, pDraw, pAway } normalized to sum to 1.0, or null on miss.
 * pmHome / pmAway are always the ESPN-home/away codes (not slug order).
 */
async function trySlug(slug, pmHome, pmAway) {
  const url = `${PM_BASE}?slug=${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const markets = data[0].markets ?? [];
    let pHome = null, pDraw = null, pAway = null;

    for (const mkt of markets) {
      const price = getOutcomePrice(mkt.outcomePrices);
      if (!isFinite(price)) continue;
      const ms = (mkt.slug ?? '').toLowerCase();
      if (ms.endsWith(`-${pmHome}`))      pHome = price;
      else if (ms.endsWith('-draw'))       pDraw = price;
      else if (ms.endsWith(`-${pmAway}`)) pAway = price;
    }

    if (pHome === null || pDraw === null || pAway === null) return null;
    const total = pHome + pDraw + pAway;
    if (total <= 0) return null;

    return {
      pHome: pHome / total,
      pDraw: pDraw / total,
      pAway: pAway / total,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch Polymarket odds for one ESPN match.
 * Tries the ESPN home/away slug ordering first, then the reversed ordering
 * (Polymarket sometimes swaps team order from ESPN's designation).
 */
async function fetchMatchOdds(homeAbbr, awayAbbr, date) {
  const pmHome = toPM(homeAbbr);
  const pmAway = toPM(awayAbbr);

  // Primary: fifwc-{pmHome}-{pmAway}-{date}
  const primary  = `fifwc-${pmHome}-${pmAway}-${date}`;
  const primary_result = await trySlug(primary, pmHome, pmAway);
  if (primary_result) return primary_result;

  await sleep(60);

  // Fallback: fifwc-{pmAway}-{pmHome}-{date}  (Polymarket lists away team first)
  // Market suffixes still identify each team by their PM code, so pmHome/pmAway
  // extraction logic in trySlug remains correct regardless of slug order.
  const reversed = `fifwc-${pmAway}-${pmHome}-${date}`;
  const reversed_result = await trySlug(reversed, pmHome, pmAway);
  return reversed_result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fmt(n) {
  return n.toFixed(4);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== fetch-match-odds.mjs ===\n');
  console.log('Fetching WC 2026 match schedule from ESPN...');

  const matches = await fetchESPNMatches();
  console.log(`\nTotal unique matches found: ${matches.length}`);

  if (matches.length === 0) {
    console.warn('\nNo matches returned by ESPN — keeping existing matchOdds.ts unchanged.');
    process.exit(0);
  }

  // Filter to real team abbreviations (skip TBD placeholder entries)
  const real = matches.filter(
    m => m.homeAbbr && m.awayAbbr
      && m.homeAbbr !== 'TBD' && m.awayAbbr !== 'TBD'
      && m.homeAbbr.length <= 4 && m.awayAbbr.length <= 4
  );
  console.log(`  (${real.length} with known teams, ${matches.length - real.length} placeholder/TBD skipped)\n`);

  const oddsMap = {};
  let found = 0, missing = 0;

  for (const { homeAbbr, awayAbbr, date } of real) {
    const key  = `${homeAbbr}_${awayAbbr}`;
    const odds = await fetchMatchOdds(homeAbbr, awayAbbr, date);

    if (odds) {
      oddsMap[key] = odds;
      found++;
      console.log(
        `  ✓ ${key.padEnd(10)} ${date}  ` +
        `home=${fmt(odds.pHome)}  draw=${fmt(odds.pDraw)}  away=${fmt(odds.pAway)}`
      );
    } else {
      missing++;
      console.log(`  ✗ ${key.padEnd(10)} ${date}  (no Polymarket market)`);
    }

    await sleep(120); // ~8 req/s — polite for a public API
  }

  console.log(
    `\nPolymarket coverage: ${found}/${real.length} matches` +
    ` (${missing} missing — will use Elo fallback)`
  );

  if (found === 0) {
    console.warn('\nZero markets found — keeping existing matchOdds.ts unchanged.');
    process.exit(0);
  }

  // ── Generate matchOdds.ts ──────────────────────────────────────────────────
  const now = new Date().toISOString();

  const entries = Object.entries(oddsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { pHome, pDraw, pAway }]) =>
      `  ${key}: { pHome: ${fmt(pHome)}, pDraw: ${fmt(pDraw)}, pAway: ${fmt(pAway)} },`
    )
    .join('\n');

  const output =
`// ─────────────────────────────────────────────────────────────────────────────
// Match-specific win probabilities sourced from Polymarket prediction market.
// Auto-updated every 6 hours by scripts/fetch-match-odds.mjs via GitHub Actions.
// Source: gamma-api.polymarket.com — fifwc-* match events
//
// Key format: "HOMEABBR_AWAYABBR"  (ESPN API home/away designation)
// pHome + pDraw + pAway = 1.0 (normalized from Polymarket market prices)
//
// Coverage:
//   Group stage  — all 72 scheduled matches (available pre-tournament)
//   Knockout     — added as each round's bracket is published on Polymarket
//   Fallback     — simulation.ts uses the Elo/strength formula for any match
//                  not covered here (hypothetical bracket paths, early in tourney)
//
// Last fetched: ${now}
// Markets found: ${found} / ${real.length}
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchOdds {
  pHome: number;
  pDraw: number;
  pAway: number;
}

/**
 * Polymarket match odds keyed by "HOMEABBR_AWAYABBR".
 * ${found} markets fetched on ${now}.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
${entries}
};

/** ISO timestamp of the last successful fetch. */
export const MATCH_ODDS_FETCHED_AT = '${now}';
`;

  writeFileSync(OUT_PATH, output, 'utf8');
  console.log(`\nWrote ${OUT_PATH}  (${found} entries)`);
}

main().catch(err => {
  console.error('fetch-match-odds.mjs failed:', err);
  process.exit(1);
});
