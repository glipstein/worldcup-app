import type { Match, Stage, SimDrafterResult } from './types';
import { DRAFT_CONFIG, DRAFTER_BY_ABBR } from '../config/draft';
import { getStrength } from './teamStrength';

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
  const pHome = s1 / (s1 + s2); // raw win probability for home side
  const r = Math.random();

  if (stage !== 'GROUP') {
    // Knockout: no draws possible
    return r < pHome ? 'home' : 'away';
  }

  // Group stage: ~25% base draw rate, modulated by strength gap
  const drawRate = 0.25;
  const pHomeWin = pHome * (1 - drawRate);
  const pDraw = drawRate;
  if (r < pHomeWin) return 'home';
  if (r < pHomeWin + pDraw) return 'draw';
  return 'away';
}

// ─── Points lookup (mirrors scoring.ts to keep simulation self-contained) ─────

const STAGE_PTS: Record<Stage, { win: number; draw: number; loss: number }> = {
  GROUP:         { win: 1,   draw: 0.5, loss: 0 },
  ROUND_OF_32:   { win: 2,   draw: 0,   loss: 0 },
  ROUND_OF_16:   { win: 3,   draw: 0,   loss: 0 },
  QUARTER_FINAL: { win: 4,   draw: 0,   loss: 0 },
  SEMI_FINAL:    { win: 5,   draw: 0,   loss: 0 },
  THIRD_PLACE:   { win: 0,   draw: 0,   loss: 0 },
  FINAL:         { win: 6,   draw: 0,   loss: 0 },
};

function matchPts(
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

// ─── One full simulation run ──────────────────────────────────────────────────

function runOnce(
  finishedMatches: Match[],
  pendingMatches: Match[]
): Record<string, number> {
  const points: Record<string, number> = {};
  DRAFT_CONFIG.forEach(d => { points[d.id] = 0; });

  // Accumulate already-played match points
  for (const m of finishedMatches) {
    if (!m.winner) continue;
    for (const abbr of [m.homeAbbr, m.awayAbbr]) {
      const drafterId = DRAFTER_BY_ABBR.get(abbr);
      if (!drafterId) continue;
      points[drafterId] += matchPts(abbr, m.homeAbbr, m.winner, m.stage);
    }
  }

  // Simulate remaining matches
  for (const m of pendingMatches) {
    const outcome = simulateOutcome(m.homeAbbr, m.awayAbbr, m.stage);
    for (const abbr of [m.homeAbbr, m.awayAbbr]) {
      const drafterId = DRAFTER_BY_ABBR.get(abbr);
      if (!drafterId) continue;
      points[drafterId] += matchPts(abbr, m.homeAbbr, outcome, m.stage);
    }
  }

  return points;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function runSingleSim(allMatches: Match[]): SimDrafterResult[] {
  const finished = allMatches.filter(m => m.status === 'finished');
  const pending  = allMatches.filter(m => m.status !== 'finished');
  const points   = runOnce(finished, pending);

  return DRAFT_CONFIG
    .map(d => ({ id: d.id, name: d.name, color: d.color, total: points[d.id] ?? 0 }))
    .sort((a, b) => b.total - a.total);
}

export function runMonteCarlo(
  allMatches: Match[],
  numSims = 50_000
): Record<string, number> {
  const finished = allMatches.filter(m => m.status === 'finished');
  const pending  = allMatches.filter(m => m.status !== 'finished');

  const wins: Record<string, number> = {};
  DRAFT_CONFIG.forEach(d => { wins[d.id] = 0; });

  for (let i = 0; i < numSims; i++) {
    const pts = runOnce(finished, pending);
    const max = Math.max(...Object.values(pts));
    const leaders = Object.entries(pts).filter(([, v]) => v === max).map(([k]) => k);
    // Split the win share equally on ties
    for (const id of leaders) wins[id] += 1 / leaders.length;
  }

  const probs: Record<string, number> = {};
  DRAFT_CONFIG.forEach(d => { probs[d.id] = (wins[d.id] ?? 0) / numSims; });
  return probs;
}
