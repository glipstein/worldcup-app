// ─────────────────────────────────────────────────────────────────────────────
// Daily odds snapshot — records one data point per calendar day for the trend
// charts on the debug page.
//
// Run by the every-6h GitHub Action (scripts run AFTER fetch-match-odds.mjs, so
// they use the freshest Polymarket odds). Reuses the *real* simulation engine
// (src/lib/simulation.ts) via tsx so the stored numbers always match what the
// app computes in-browser — no reimplementation to drift out of sync.
//
// Output: src/data/oddsHistory.json (committed by the workflow → triggers a
// Pages rebuild). Entries are upserted by date: if the Action runs 4× in a day,
// today's point is overwritten each time with the latest inputs, keeping a clean
// one-point-per-day x-axis.
//
//   Local run:  npx tsx scripts/snapshot-odds.ts
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { fetchAllMatches } from '../src/lib/espn';
import { runMonteCarloFull } from '../src/lib/simulation';
import { DRAFT_CONFIG, DRAFTER_BY_ABBR } from '../src/config/draft';

// Higher than the in-browser 50k since this runs in CI and blocks no one.
const NUM_SIMS = 200_000;

interface DaySnapshot {
  date: string;                         // YYYY-MM-DD (UTC)
  drafters: Record<string, number>;     // drafterId → P(win pool)
  teams: Record<string, number>;        // teamAbbr  → P(win tournament)
}

interface HistoryFile {
  updatedAt: string;
  numSims: number;
  history: DaySnapshot[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'src', 'data', 'oddsHistory.json');

function round(probs: Record<string, number>, dp = 4): Record<string, number> {
  const f = 10 ** dp;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(probs)) out[k] = Math.round(v * f) / f;
  return out;
}

function loadHistory(): HistoryFile {
  if (!existsSync(OUT_PATH)) {
    return { updatedAt: '', numSims: NUM_SIMS, history: [] };
  }
  try {
    const parsed = JSON.parse(readFileSync(OUT_PATH, 'utf-8')) as HistoryFile;
    if (!Array.isArray(parsed.history)) throw new Error('malformed history');
    return parsed;
  } catch (err) {
    console.warn(`⚠️  Could not parse existing ${OUT_PATH} — starting fresh.`, err);
    return { updatedAt: '', numSims: NUM_SIMS, history: [] };
  }
}

async function main() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

  console.log('Fetching WC 2026 schedule from ESPN…');
  const matches = await fetchAllMatches();
  if (matches.length === 0) {
    console.log('No matches returned from ESPN — skipping snapshot (no changes).');
    return;
  }
  const finished = matches.filter(m => m.status === 'finished').length;
  console.log(`  ${matches.length} matches (${finished} finished).`);

  console.log(`Running ${NUM_SIMS.toLocaleString()} simulations…`);
  const { drafters, teams } = runMonteCarloFull(
    matches, NUM_SIMS, DRAFT_CONFIG, DRAFTER_BY_ABBR
  );

  // ESPN tags some bracket matches with placeholder abbreviations (e.g. "SF L1")
  // which can leak into the synthetic bracket as phantom champions. Keep only
  // the 48 real drafted teams and renormalize so the shares sum to ~1.0.
  const realTeams = new Set(DRAFT_CONFIG.flatMap(d => d.teams.map(t => t.espnAbbr)));
  const filtered: Record<string, number> = {};
  let kept = 0;
  for (const [abbr, p] of Object.entries(teams)) {
    if (realTeams.has(abbr)) { filtered[abbr] = p; kept += p; }
  }
  if (kept > 0) {
    for (const abbr of Object.keys(filtered)) filtered[abbr] /= kept;
  }

  const entry: DaySnapshot = {
    date: today,
    drafters: round(drafters),
    teams: round(filtered),
  };

  const file = loadHistory();
  const idx = file.history.findIndex(h => h.date === today);
  if (idx >= 0) {
    file.history[idx] = entry;       // upsert: overwrite today's point
    console.log(`Updated existing snapshot for ${today}.`);
  } else {
    file.history.push(entry);
    console.log(`Added new snapshot for ${today}.`);
  }
  file.history.sort((a, b) => a.date.localeCompare(b.date));
  file.updatedAt = now.toISOString();
  file.numSims = NUM_SIMS;

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(file, null, 2) + '\n');

  // Quick console summary
  const topDrafter = Object.entries(drafters).sort((a, b) => b[1] - a[1])[0];
  const topTeam = Object.entries(teams).sort((a, b) => b[1] - a[1])[0];
  console.log(`✓ Wrote ${OUT_PATH} (${file.history.length} day(s)).`);
  if (topDrafter) console.log(`  Leading drafter: ${topDrafter[0]} ${(topDrafter[1] * 100).toFixed(1)}%`);
  if (topTeam)    console.log(`  Favorite team:   ${topTeam[0]} ${(topTeam[1] * 100).toFixed(1)}%`);
}

main().catch(err => {
  console.error('Snapshot failed:', err);
  process.exit(1);
});
