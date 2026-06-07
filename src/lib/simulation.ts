import type { Match, Stage, DrafterTotals } from './types';
import { DRAFT_CONFIG, DRAFTER_BY_ABBR } from '../config/draft';
import { getStrength } from './teamStrength';
import { calculateDrafterTotals } from './scoring';

// ─── Probability model ────────────────────────────────────────────────────────

/**
 * Simulate a single match outcome using a Bradley-Terry strength model.
 * Group stage allows draws; knockout rounds don't (extra-time/pens → one winner).
 */
function simulateOutcome(
  homeAbbr: string,
  awayAbbr: string,
  stage: Stage
): 'home' | 'away' | 'draw' {
  const s1 = getStrength(homeAbbr);
  const s2 = getStrength(awayAbbr);
  const pHome = s1 / (s1 + s2);
  const r = Math.random();

  if (stage !== 'GROUP') {
    return r < pHome ? 'home' : 'away';
  }

  const drawRate = 0.25;
  const pHomeWin = pHome * (1 - drawRate);
  if (r < pHomeWin) return 'home';
  if (r < pHomeWin + drawRate) return 'draw';
  return 'away';
}

// ─── Fast points-only path (used by Monte Carlo) ──────────────────────────────

const STAGE_PTS: Record<Stage, { win: number; draw: number; loss: number }> = {
  GROUP:         { win: 1,   draw: 0.5, loss: 0 },
  ROUND_OF_32:   { win: 2,   draw: 0,   loss: 0 },
  ROUND_OF_16:   { win: 3,   draw: 0,   loss: 0 },
  QUARTER_FINAL: { win: 4,   draw: 0,   loss: 0 },
  SEMI_FINAL:    { win: 5,   draw: 0,   loss: 0 },
  THIRD_PLACE:   { win: 0,   draw: 0,   loss: 0 },
  FINAL:         { win: 6,   draw: 0,   loss: 0 },
};

function fastMatchPts(
  abbr: string,
  homeAbbr: string,
  outcome: 'home' | 'away' | 'draw',
  stage: Stage
): number {
  const result =
    outcome === 'draw'
      ? 'draw'
      : (abbr === homeAbbr ? outcome === 'home' : outcome === 'away')
      ? 'win'
      : 'loss';
  return STAGE_PTS[stage][result];
}

function runOnceFast(
  finishedMatches: Match[],
  pendingMatches: Match[]
): Record<string, number> {
  const points: Record<string, number> = {};
  DRAFT_CONFIG.forEach(d => { points[d.id] = 0; });

  for (const m of finishedMatches) {
    if (!m.winner) continue;
    for (const abbr of [m.homeAbbr, m.awayAbbr]) {
      const id = DRAFTER_BY_ABBR.get(abbr);
      if (id) points[id] += fastMatchPts(abbr, m.homeAbbr, m.winner, m.stage);
    }
  }

  for (const m of pendingMatches) {
    const outcome = simulateOutcome(m.homeAbbr, m.awayAbbr, m.stage);
    for (const abbr of [m.homeAbbr, m.awayAbbr]) {
      const id = DRAFTER_BY_ABBR.get(abbr);
      if (id) points[id] += fastMatchPts(abbr, m.homeAbbr, outcome, m.stage);
    }
  }

  return points;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Simulate a single completion of the remaining tournament.
 * Returns full DrafterTotals (per-team match breakdown) so PointsTable can render it.
 */
export function runSingleSim(allMatches: Match[]): DrafterTotals[] {
  const finished = allMatches.filter(m => m.status === 'finished');
  const pending  = allMatches.filter(m => m.status !== 'finished');

  // Turn each pending match into a "finished" match with a simulated outcome
  const simulated: Match[] = pending.map(m => {
    const outcome = simulateOutcome(m.homeAbbr, m.awayAbbr, m.stage);
    return {
      ...m,
      status: 'finished' as const,
      winner: outcome,
      homeScore: outcome === 'home' ? 1 : 0,
      awayScore: outcome === 'away' ? 1 : 0,
    };
  });

  return calculateDrafterTotals([...finished, ...simulated]);
}

/**
 * Run numSims simulations and return each drafter's win probability (0–1).
 * Uses a fast points-only path to keep 50 000 runs snappy.
 */
export function runMonteCarlo(
  allMatches: Match[],
  numSims = 50_000
): Record<string, number> {
  const finished = allMatches.filter(m => m.status === 'finished');
  const pending  = allMatches.filter(m => m.status !== 'finished');

  const wins: Record<string, number> = {};
  DRAFT_CONFIG.forEach(d => { wins[d.id] = 0; });

  for (let i = 0; i < numSims; i++) {
    const pts = runOnceFast(finished, pending);
    const max = Math.max(...Object.values(pts));
    const leaders = Object.entries(pts)
      .filter(([, v]) => v === max)
      .map(([k]) => k);
    for (const id of leaders) wins[id] += 1 / leaders.length;
  }

  const probs: Record<string, number> = {};
  DRAFT_CONFIG.forEach(d => { probs[d.id] = (wins[d.id] ?? 0) / numSims; });
  return probs;
}
