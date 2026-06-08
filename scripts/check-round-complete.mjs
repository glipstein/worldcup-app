/**
 * check-round-complete.mjs
 *
 * Polls the ESPN WC 2026 scoreboard API and determines whether a new
 * tournament stage (group stage, round of 32, QF, etc.) has fully
 * completed since the last Elo update.
 *
 * Decision logic:
 *   1. Fetch all WC 2026 matches.
 *   2. Find the latest stage where every match is finished.
 *   3. Check that ≥ LAG_HOURS have passed since the final match
 *      (gives martj42/international_results time to ingest results).
 *   4. Compare against .github/elo-update-state.json to skip already-
 *      processed stages.
 *   5. Write trigger_update + completed_stage to $GITHUB_OUTPUT.
 *
 * Called by .github/workflows/auto-update-strengths.yml
 * Run locally:  node scripts/check-round-complete.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, '../.github/elo-update-state.json');

// ─── ESPN config (mirrors src/lib/espn.ts) ───────────────────────────────────

const BASE =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

// WC 2026: June 11 – July 19 in weekly chunks
const DATE_CHUNKS = [
  '20260611-20260617',
  '20260618-20260624',
  '20260625-20260701',
  '20260702-20260708',
  '20260709-20260715',
  '20260716-20260719',
];

// ─── Stage ordering ───────────────────────────────────────────────────────────

// Slugs come from event.season.slug in the ESPN API response.
// Order must match tournament progression; stages not listed are ignored.
const STAGE_ORDER = [
  'group-stage',
  'round-of-32',
  'round-of-16',
  'quarterfinals',
  'semifinals',
  'final',
];

// Minimum hours to wait after the last match in a stage before triggering.
// Gives the martj42/international_results dataset time to ingest results.
const LAG_HOURS = 18;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapStatus(statusType) {
  if (statusType.completed || statusType.state === 'post') return 'finished';
  if (statusType.state === 'in') return 'live';
  return 'scheduled';
}

async function fetchAllMatches() {
  const results = await Promise.all(
    DATE_CHUNKS.map(async dates => {
      const url = `${BASE}?dates=${dates}&limit=100`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.log(`   ESPN ${res.status} for ${dates} — skipping`);
          return [];
        }
        const data = await res.json();
        return data.events ?? [];
      } catch (err) {
        console.log(`   Fetch error for ${dates}: ${err.message}`);
        return [];
      }
    })
  );

  const seen = new Set();
  const matches = [];
  for (const event of results.flat()) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    const slug = event.season?.slug ?? 'group-stage';
    const status = mapStatus(event.status.type);
    matches.push({ id: event.id, date: event.date, slug, status });
  }
  return matches;
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return { lastUpdatedStage: null, lastUpdatedAt: null };
  }
}

/** Write a key=value pair to $GITHUB_OUTPUT (GitHub Actions) or log locally. */
function writeOutput(key, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${key}=${value}\n`);
  }
  // Always log so local runs and workflow logs are both readable
  console.log(`   → ${key}=${value}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍  Polling ESPN WC 2026 scoreboard…');
  const matches = await fetchAllMatches();
  console.log(`   ${matches.length} match(es) found`);

  if (matches.length === 0) {
    console.log('   Tournament has not started yet or ESPN returned no data.');
    writeOutput('trigger_update', 'false');
    return;
  }

  // ── Group by stage slug ──────────────────────────────────────────────────────
  /** @type {Map<string, Array<{date: string, status: string}>>} */
  const byStage = new Map();
  for (const m of matches) {
    const list = byStage.get(m.slug) ?? [];
    list.push(m);
    byStage.set(m.slug, list);
  }

  // Print a quick summary
  for (const slug of STAGE_ORDER) {
    const s = byStage.get(slug);
    if (!s) continue;
    const done = s.filter(m => m.status === 'finished').length;
    console.log(`   ${slug.padEnd(14)}  ${done}/${s.length} finished`);
  }

  // ── Find the latest stage where ALL matches are complete ─────────────────────
  const now = Date.now();
  let latestCompleteSlug = null;
  let lastMatchTime = null;

  for (const slug of [...STAGE_ORDER].reverse()) {
    const stageMatches = byStage.get(slug);
    if (!stageMatches || stageMatches.length === 0) continue;

    const allFinished = stageMatches.every(m => m.status === 'finished');
    if (!allFinished) continue;

    latestCompleteSlug = slug;
    lastMatchTime = Math.max(
      ...stageMatches.map(m => new Date(m.date).getTime())
    );
    break;
  }

  if (!latestCompleteSlug) {
    console.log('   No stage fully complete yet — nothing to do.');
    writeOutput('trigger_update', 'false');
    return;
  }

  console.log(`\n   Latest completed stage: ${latestCompleteSlug}`);

  // ── Lag check ────────────────────────────────────────────────────────────────
  const lagMs = LAG_HOURS * 60 * 60 * 1000;
  const elapsed = now - lastMatchTime;

  if (elapsed < lagMs) {
    const hoursLeft = ((lagMs - elapsed) / (1000 * 60 * 60)).toFixed(1);
    console.log(
      `   Waiting for martj42 lag: ${hoursLeft}h remaining (${LAG_HOURS}h total).`
    );
    writeOutput('trigger_update', 'false');
    return;
  }

  // ── State check ──────────────────────────────────────────────────────────────
  const state = readState();
  console.log(`   Last updated stage in state: ${state.lastUpdatedStage ?? 'none'}`);

  const prevIdx = STAGE_ORDER.indexOf(state.lastUpdatedStage ?? '');
  const currIdx = STAGE_ORDER.indexOf(latestCompleteSlug);

  if (currIdx <= prevIdx) {
    console.log('   Already up to date — skipping.');
    writeOutput('trigger_update', 'false');
    return;
  }

  // ── Trigger! ─────────────────────────────────────────────────────────────────
  console.log(`\n✅  New stage complete: ${latestCompleteSlug}`);
  console.log('   Triggering Elo update…');
  writeOutput('trigger_update', 'true');
  writeOutput('completed_stage', latestCompleteSlug);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
