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

// ── Winner market: Polymarket display name → ESPN abbreviation ───────────────
// Used to parse the "world-cup-winner" event (one child market per team).
// Names verified against the live market on 2026-06-08.
const WINNER_NAME_TO_ESPN = {
  'Spain':                    'ESP',
  'France':                   'FRA',
  'England':                  'ENG',
  'Brazil':                   'BRA',
  'Portugal':                 'POR',
  'Argentina':                'ARG',
  'Germany':                  'GER',
  'Netherlands':              'NED',
  'Norway':                   'NOR',
  'Belgium':                  'BEL',
  'Japan':                    'JPN',
  'Colombia':                 'COL',
  'Morocco':                  'MAR',
  'Mexico':                   'MEX',
  'Turkiye':                  'TUR',
  'Turkey':                   'TUR',
  'Switzerland':              'SUI',
  'United States':            'USA',
  'USA':                      'USA',
  'Croatia':                  'CRO',
  'Ecuador':                  'ECU',
  'Uruguay':                  'URU',
  'Senegal':                  'SEN',
  'Austria':                  'AUT',
  'Ivory Coast':              'CIV',
  "Cote d'Ivoire":            'CIV',
  'Sweden':                   'SWE',
  'Canada':                   'CAN',
  'South Korea':              'KOR',
  'Czechia':                  'CZE',
  'Czech Republic':           'CZE',
  'Scotland':                 'SCO',
  'Paraguay':                 'PAR',
  'Egypt':                    'EGY',
  'Algeria':                  'ALG',
  'Australia':                'AUS',
  'Bosnia-Herzegovina':       'BIH',
  'Bosnia & Herzegovina':     'BIH',
  'Bosnia and Herzegovina':   'BIH',
  'Iran':                     'IRN',
  'Ghana':                    'GHA',
  'Congo DR':                 'COD',
  'DR Congo':                 'COD',
  'Saudi Arabia':             'KSA',
  'Tunisia':                  'TUN',
  'Uzbekistan':               'UZB',
  'Panama':                   'PAN',
  'Iraq':                     'IRQ',
  'South Africa':             'RSA',
  'Haiti':                    'HAI',
  'New Zealand':              'NZL',
  'Jordan':                   'JOR',
  'Curaçao':                  'CUW',
  'Curacao':                  'CUW',
  'Cape Verde':               'CPV',
  'Qatar':                    'QAT',
};

// ── Market-implied strength formula ──────────────────────────────────────────
//
// Converts a team's tournament outright-win probability p into a 0-100 strength
// value on the same scale as TEAM_STRENGTH (Elo-derived).
//
// Formula:  s = clamp( 50 + 50 × log₁₀(p / P_AVG) , 0, 100 )
//
// Calibration anchors:
//   p = P_AVG = 1/48  →  s = 50  (exactly average team in a 48-team field)
//   p = 16%            →  s ≈ 94  (Spain / France — confirmed reasonable)
//   p = 2%             →  s ≈ 49  (Colombia — down from Elo 75, as expected)
//   p = 0.85%          →  s ≈ 31  (Ecuador — down from Elo 74)
//
// Only applied when p ≥ P_THRESHOLD (0.5%).  Below that, Polymarket signal is
// too noisy to distinguish per-match quality from bracket luck, so the Elo
// TEAM_STRENGTH is kept as fallback.

const P_AVERAGE   = 1 / 48;   // equal-strength baseline for a 48-team field
const P_THRESHOLD = 0.005;    // 0.5% — minimum probability for calibration

function winProbToStrength(p) {
  if (p < P_THRESHOLD) return null;  // signal too weak → keep Elo fallback
  const s = 50 + 50 * Math.log10(p / P_AVERAGE);
  return Math.max(0, Math.min(100, Math.round(s)));
}

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

// ── Tournament winner odds → MARKET_STRENGTH ─────────────────────────────────

/**
 * Fetches the Polymarket "world-cup-winner" event and converts each team's
 * outright win probability into a market-calibrated strength (0-100).
 *
 * Returns a Record<espnAbbr, strength>.  Only teams above P_THRESHOLD (0.5%)
 * are included — teams below that fall back to Elo in simulation.ts.
 */
async function fetchWinnerOdds() {
  const url = `${PM_BASE}?slug=world-cup-winner`;
  console.log('\nFetching tournament winner market...');
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(`  Winner market: HTTP ${res.status} — skipping`);
      return {};
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('  Winner market: no data returned');
      return {};
    }

    const markets = data[0].markets ?? [];
    const result  = {};
    let calibrated = 0, skipped = 0, unknown = 0;

    for (const mkt of markets) {
      const title = mkt.groupItemTitle ?? '';
      const espn  = WINNER_NAME_TO_ESPN[title];
      if (!espn) {
        // "Team AM", "Other", placeholder slots — ignore
        if (title && !title.startsWith('Team ') && title !== 'Other') {
          console.log(`  Winner: unrecognised title "${title}"`);
          unknown++;
        }
        continue;
      }

      const p = getOutcomePrice(mkt.outcomePrices);
      if (!isFinite(p) || p <= 0) { skipped++; continue; }

      const s = winProbToStrength(p);
      if (s === null) {
        // Below threshold — will use Elo fallback; log for visibility
        console.log(
          `  Winner: ${espn.padEnd(4)} ${title.padEnd(22)} ` +
          `p=${(p * 100).toFixed(2).padStart(5)}%  →  below threshold, keeps Elo`
        );
        skipped++;
        continue;
      }

      result[espn] = s;
      calibrated++;
      console.log(
        `  Winner: ${espn.padEnd(4)} ${title.padEnd(22)} ` +
        `p=${(p * 100).toFixed(2).padStart(5)}%  →  market strength ${s}`
      );
    }

    console.log(
      `  Done: ${calibrated} teams calibrated, ${skipped} below threshold (keep Elo), ` +
      `${unknown} unrecognised`
    );
    return result;
  } catch (e) {
    console.warn(`  Winner market fetch failed: ${e.message} — skipping`);
    return {};
  }
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
    console.warn('\nZero match markets found — keeping existing matchOdds.ts unchanged.');
    process.exit(0);
  }

  // ── Fetch tournament winner odds for market-calibrated strength values ──────
  const marketStrength = await fetchWinnerOdds();

  // ── Generate matchOdds.ts ──────────────────────────────────────────────────
  const now = new Date().toISOString();

  const matchEntries = Object.entries(oddsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { pHome, pDraw, pAway }]) =>
      `  ${key}: { pHome: ${fmt(pHome)}, pDraw: ${fmt(pDraw)}, pAway: ${fmt(pAway)} },`
    )
    .join('\n');

  const strengthEntries = Object.entries(marketStrength)
    .sort(([a], [b]) => marketStrength[b] - marketStrength[a] || a.localeCompare(b))
    .map(([abbr, s]) => `  ${abbr}: ${s},`)
    .join('\n');

  const calibratedCount = Object.keys(marketStrength).length;

  const output =
`// ─────────────────────────────────────────────────────────────────────────────
// Match-specific win probabilities + market-calibrated team strengths.
// Auto-updated every 6 hours by scripts/fetch-match-odds.mjs via GitHub Actions.
// Source: gamma-api.polymarket.com
//
// MATCH_ODDS key format: "HOMEABBR_AWAYABBR"  (ESPN API home/away designation)
//   pHome + pDraw + pAway = 1.0 (normalized from Polymarket 3-way market prices)
//
// MARKET_STRENGTH: derived from the "world-cup-winner" outright market.
//   Formula:  s = clamp( 50 + 50 × log₁₀(p / (1/48)) , 0, 100 )
//   Only teams with p ≥ 0.5% are included; others keep Elo-based TEAM_STRENGTH.
//
// Last fetched: ${now}
// Match markets: ${found} / ${real.length}
// Strength calibrations: ${calibratedCount} teams
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchOdds {
  pHome: number;
  pDraw: number;
  pAway: number;
}

/**
 * Polymarket 3-way match odds keyed by "HOMEABBR_AWAYABBR".
 * ${found} markets fetched on ${now}.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
${matchEntries}
};

/**
 * Market-calibrated team strengths (0-100) derived from Polymarket tournament
 * winner odds.  Used by simulation.ts as the fallback strength when no
 * match-specific market exists (e.g. hypothetical bracket paths).
 *
 * ${calibratedCount} teams covered (p ≥ 0.5%); teams below threshold use Elo TEAM_STRENGTH.
 * Sorted strongest-first for readability.
 */
export const MARKET_STRENGTH: Record<string, number> = {
${strengthEntries}
};

/** ISO timestamp of the last successful fetch. */
export const MATCH_ODDS_FETCHED_AT = '${now}';
`;

  writeFileSync(OUT_PATH, output, 'utf8');
  console.log(`\nWrote ${OUT_PATH}  (${found} match markets, ${calibratedCount} strength calibrations)`);
}

main().catch(err => {
  console.error('fetch-match-odds.mjs failed:', err);
  process.exit(1);
});
