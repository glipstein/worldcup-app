// ─────────────────────────────────────────────────────────────────────────────
// Calibrate the per-match logistic steepness D so the SIMULATED tournament-winner
// odds reproduce the Polymarket world-cup-winner market as closely as possible.
//
// Why: at D=50 the per-match model is too steep — favorites win mismatches ~88%
// and that compounds over a 5-round knockout, inflating top-team championship
// odds well above the market (e.g. Spain ~24% sim vs ~16% market). Flattening D
// spreads the probability out. This sweeps D and reports the fit per team.
//
//   npx tsx scripts/calibrate-d.ts
// ─────────────────────────────────────────────────────────────────────────────

import { fetchAllMatches } from '../src/lib/espn';
import { runMonteCarloFull, setMatchModelD } from '../src/lib/simulation';
import { DRAFT_CONFIG, DRAFTER_BY_ABBR } from '../src/config/draft';
import { MARKET_STRENGTH } from '../src/lib/matchOdds';

const FLOOR = 10;            // teams at/below this have no real winner-market signal
const P_AVG = 1 / 48;        // strength-formula reference probability
const NUM_SIMS = 100_000;    // per D value (SE on a 16% prob ≈ 0.12%)
const D_VALUES = [50, 60, 70, 80, 90, 100, 110, 120, 140, 160, 180, 200];

// Invert MARKET_STRENGTH → market championship prob, restricted to teams with a
// real signal (strength > floor), renormalized to sum to 1 over that set.
// This de-vigs the market and gives the calibration target.
function marketTargets(): Record<string, number> {
  const raw: Record<string, number> = {};
  let sum = 0;
  for (const [abbr, s] of Object.entries(MARKET_STRENGTH)) {
    if (s <= FLOOR) continue;
    const p = P_AVG * 10 ** ((s - 50) / 50);
    raw[abbr] = p;
    sum += p;
  }
  const target: Record<string, number> = {};
  for (const [abbr, p] of Object.entries(raw)) target[abbr] = p / sum;
  return target;
}

function pct(x: number): string {
  return (x * 100).toFixed(1).padStart(5) + '%';
}

async function main() {
  console.log(`Fetching WC 2026 schedule…`);
  const matches = await fetchAllMatches();
  console.log(`  ${matches.length} matches.\n`);

  const target = marketTargets();
  const teams = Object.keys(target).sort((a, b) => target[b] - target[a]);

  // sim[D][abbr] = renormalized simulated champ prob over the target team set
  const sim: Record<number, Record<string, number>> = {};
  const wmae: Record<number, number> = {}; // market-prob-weighted mean abs error
  const maxAbs: Record<number, { abbr: string; err: number }> = {};

  for (const D of D_VALUES) {
    setMatchModelD(D);
    const { teams: champ } = runMonteCarloFull(
      matches, NUM_SIMS, DRAFT_CONFIG, DRAFTER_BY_ABBR
    );
    let s = 0;
    for (const a of teams) s += champ[a] ?? 0;
    const norm: Record<string, number> = {};
    for (const a of teams) norm[a] = (champ[a] ?? 0) / (s || 1);
    sim[D] = norm;

    let errSum = 0, wSum = 0, worst = { abbr: '', err: 0 };
    for (const a of teams) {
      const e = Math.abs(norm[a] - target[a]);
      errSum += target[a] * e;
      wSum += target[a];
      if (e > worst.err) worst = { abbr: a, err: e };
    }
    wmae[D] = errSum / wSum;
    maxAbs[D] = worst;
    process.stdout.write(`  D=${String(D).padStart(3)} done  (wMAE ${pct(wmae[D])}, worst ${worst.abbr} ${pct(worst.err)})\n`);
  }

  // ── Per-team fit table (top 16 teams) ──────────────────────────────────────
  const show = teams.slice(0, 16);
  const cols = D_VALUES;
  console.log('\nPer-team championship probability — market vs simulated:\n');
  console.log(
    'TEAM  MARKET ' + cols.map(d => ('D' + d).padStart(7)).join('')
  );
  for (const a of show) {
    console.log(
      a.padEnd(5) + pct(target[a]) + ' ' +
      cols.map(d => pct(sim[d][a])).join('')
    );
  }

  console.log('\nFit by D (lower = closer to market):\n');
  console.log('  D    wMAE   worst-team');
  for (const d of D_VALUES) {
    console.log(`  ${String(d).padStart(3)}  ${pct(wmae[d])}  ${maxAbs[d].abbr} ${pct(maxAbs[d].err)}`);
  }

  const best = D_VALUES.reduce((b, d) => (wmae[d] < wmae[b] ? d : b), D_VALUES[0]);
  console.log(`\n➡  Best D in sweep: ${best}  (wMAE ${pct(wmae[best])})`);
  console.log(`   Spain target ${pct(target['ESP'])} → sim ${pct(sim[best]['ESP'])}`);
}

main().catch(err => { console.error(err); process.exit(1); });
