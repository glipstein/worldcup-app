import type { Match, Stage, DrafterTotals } from './types';
import { DRAFT_CONFIG, DRAFTER_BY_ABBR } from '../config/draft';
import { getStrength, TEAM_STRENGTH } from './teamStrength';
import { calculateDrafterTotals } from './scoring';

// ─── Probability model ────────────────────────────────────────────────────────

/**
 * Bradley-Terry match outcome simulator.
 * Group stage allows draws; knockout rounds are binary (ET/pens → one winner).
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

  // Group stage: 25% flat draw rate, rest split by relative strength
  const drawRate = 0.25;
  const pHomeWin = pHome * (1 - drawRate);
  if (r < pHomeWin) return 'home';
  if (r < pHomeWin + drawRate) return 'draw';
  return 'away';
}

// ─── Points tables (must match scoring.ts exactly) ───────────────────────────

const STAGE_PTS: Record<Stage, { win: number; draw: number; loss: number }> = {
  GROUP:         { win: 1,   draw: 0.5, loss: 0 },
  ROUND_OF_32:   { win: 2,   draw: 0,   loss: 0 },
  ROUND_OF_16:   { win: 3,   draw: 0,   loss: 0 },
  QUARTER_FINAL: { win: 4,   draw: 0,   loss: 0 },
  SEMI_FINAL:    { win: 5,   draw: 0,   loss: 0 },
  THIRD_PLACE:   { win: 0,   draw: 0,   loss: 0 },
  FINAL:         { win: 6,   draw: 0,   loss: 0 },
};

const KO_STAGES: Stage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL',
];

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

// ─── Shared detection: is the knockout bracket real yet? ─────────────────────

/**
 * Returns true once ESPN has knockout matches with known (non-placeholder) teams.
 * ESPN pre-schedules the full bracket from day one using placeholder abbreviations
 * (e.g. "TBD"). We ignore those by requiring both teams to be in TEAM_STRENGTH.
 */
function knockoutBracketIsReal(allMatches: Match[]): boolean {
  return allMatches.some(
    m => m.stage !== 'GROUP' && m.stage !== 'THIRD_PLACE'
      && (m.homeAbbr in TEAM_STRENGTH)
      && (m.awayAbbr in TEAM_STRENGTH)
  );
}

// ─── Group structure ──────────────────────────────────────────────────────────

/**
 * Derive group membership from the group-stage match schedule using Union-Find.
 * Any two teams that play each other in the group stage end up in the same group.
 */
function buildGroups(allMatches: Match[]): string[][] {
  const parent = new Map<string, string>();

  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x);
    const p = parent.get(x)!;
    if (p !== x) parent.set(x, find(p));
    return parent.get(x)!;
  }

  for (const m of allMatches) {
    if (m.stage !== 'GROUP' || !m.homeAbbr || !m.awayAbbr) continue;
    const rx = find(m.homeAbbr), ry = find(m.awayAbbr);
    if (rx !== ry) parent.set(rx, ry);
  }

  const groups = new Map<string, string[]>();
  for (const [team] of parent) {
    const root = find(team);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(team);
  }

  return [...groups.values()];
}

// ─── Bracket helpers ──────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a new array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Determine the 32 knockout qualifiers.
 * Top 2 per group advance automatically; best 8 third-place finishers also advance.
 * Tiebreaker: team strength (simpler than goal difference across 50k runs).
 */
function determineQualifiers(
  groups: string[][],
  soccer: Record<string, number>
): string[] {
  const top2: string[] = [];
  const thirdPlace: Array<{ abbr: string; pts: number }> = [];

  for (const group of groups) {
    const sorted = [...group].sort((a, b) => {
      const pd = (soccer[b] ?? 0) - (soccer[a] ?? 0);
      return pd !== 0 ? pd : getStrength(b) - getStrength(a);
    });
    if (sorted[0]) top2.push(sorted[0]);
    if (sorted[1]) top2.push(sorted[1]);
    if (sorted[2]) thirdPlace.push({ abbr: sorted[2], pts: soccer[sorted[2]] ?? 0 });
  }

  thirdPlace.sort((a, b) => {
    const pd = b.pts - a.pts;
    return pd !== 0 ? pd : getStrength(b.abbr) - getStrength(a.abbr);
  });

  return [...top2, ...thirdPlace.slice(0, 8).map(t => t.abbr)];
}

// ─── Fast single-run path (used by Monte Carlo) ───────────────────────────────

/**
 * Two modes — chosen once per MC batch, not per-sim, based on tournament state:
 *
 * Group stage (bracketIsReal = false):
 *   Score finished matches → simulate remaining group games → derive qualifiers
 *   → run a full random-draw bracket (R32/R16 → Final).
 *
 * Knockout stage (bracketIsReal = true):
 *   Score finished matches → simulate every pending ESPN match as-scheduled.
 *   Identical logic to runSingleSim's fallback path so both stay in sync.
 *
 * config / byAbbr: pass a custom draft to score a different pool (e.g. Euro debug roster).
 * Defaults to the WC 2026 draft.
 */
function runOnceFull(
  allMatches: Match[],
  groups: string[][],
  bracketIsReal: boolean,
  config: typeof DRAFT_CONFIG,
  byAbbr: Map<string, string>
): Record<string, number> {
  const poolPts: Record<string, number> = {};
  config.forEach(d => { poolPts[d.id] = 0; });

  if (bracketIsReal) {
    // ── Knockout stage: simulate directly from ESPN schedule ────────────────
    for (const m of allMatches) {
      if (!m.homeAbbr || !m.awayAbbr) continue;

      const outcome =
        m.status === 'finished' && m.winner
          ? m.winner
          : simulateOutcome(m.homeAbbr, m.awayAbbr, m.stage);

      for (const abbr of [m.homeAbbr, m.awayAbbr]) {
        const id = byAbbr.get(abbr);
        if (id) poolPts[id] += fastMatchPts(abbr, m.homeAbbr, outcome, m.stage);
      }
    }
    return poolPts;
  }

  // ── Group stage: score real results, simulate rest, derive bracket ──────────
  const soccer: Record<string, number> = {};

  // Finished matches: score pool points + seed group standings
  for (const m of allMatches) {
    if (m.status !== 'finished' || !m.winner) continue;
    for (const abbr of [m.homeAbbr, m.awayAbbr]) {
      const id = byAbbr.get(abbr);
      if (id) poolPts[id] += fastMatchPts(abbr, m.homeAbbr, m.winner, m.stage);
    }
    if (m.stage === 'GROUP') {
      soccer[m.homeAbbr] = soccer[m.homeAbbr] ?? 0;
      soccer[m.awayAbbr] = soccer[m.awayAbbr] ?? 0;
      if (m.winner === 'home')       soccer[m.homeAbbr] += 3;
      else if (m.winner === 'away')  soccer[m.awayAbbr] += 3;
      else { soccer[m.homeAbbr]++; soccer[m.awayAbbr]++; }
    }
  }

  // Pending group matches: simulate + score + track standings
  for (const m of allMatches) {
    if (m.status === 'finished' || m.stage !== 'GROUP') continue;
    if (!m.homeAbbr || !m.awayAbbr) continue;
    const outcome = simulateOutcome(m.homeAbbr, m.awayAbbr, 'GROUP');
    for (const abbr of [m.homeAbbr, m.awayAbbr]) {
      const id = byAbbr.get(abbr);
      if (id) poolPts[id] += fastMatchPts(abbr, m.homeAbbr, outcome, 'GROUP');
    }
    soccer[m.homeAbbr] = soccer[m.homeAbbr] ?? 0;
    soccer[m.awayAbbr] = soccer[m.awayAbbr] ?? 0;
    if (outcome === 'home')       soccer[m.homeAbbr] += 3;
    else if (outcome === 'away')  soccer[m.awayAbbr] += 3;
    else { soccer[m.homeAbbr]++; soccer[m.awayAbbr]++; }
  }

  // Derive qualifiers and run full bracket with a random draw
  const qualifiers = determineQualifiers(groups, soccer);
  let bracket = shuffle(qualifiers);

  for (const stage of KO_STAGES) {
    const winners: string[] = [];
    for (let i = 0; i + 1 < bracket.length; i += 2) {
      const home = bracket[i];
      const away = bracket[i + 1];
      const outcome = simulateOutcome(home, away, stage);
      const winner = outcome === 'home' ? home : away;
      const winnerId = byAbbr.get(winner);
      if (winnerId) poolPts[winnerId] += STAGE_PTS[stage].win;
      winners.push(winner);
    }
    bracket = winners;
  }

  return poolPts;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Simulate a single completion of the tournament.
 * Returns full DrafterTotals (per-team breakdown) so PointsTable can render it.
 *
 * Mirrors runOnceFull's two-mode logic exactly, but builds real Match objects
 * so calculateDrafterTotals can produce the per-round column breakdown.
 *
 * Pass `config` to use a custom draft roster (e.g. Euro debug roster).
 */
export function runSingleSim(
  allMatches: Match[],
  config: typeof DRAFT_CONFIG = DRAFT_CONFIG
): DrafterTotals[] {
  const groups = buildGroups(allMatches);
  const finished = allMatches.filter(m => m.status === 'finished');
  const pending  = allMatches.filter(m => m.status !== 'finished');

  if (knockoutBracketIsReal(allMatches)) {
    // ── Knockout stage: simulate pending ESPN matches directly ───────────────
    const simulated: Match[] = pending
      .filter(m => m.homeAbbr && m.awayAbbr)
      .map(m => {
        const outcome = simulateOutcome(m.homeAbbr, m.awayAbbr, m.stage);
        return {
          ...m,
          status: 'finished' as const,
          winner: outcome,
          homeScore: outcome === 'home' ? 1 : 0,
          awayScore: outcome === 'away' ? 1 : 0,
        };
      });
    return calculateDrafterTotals([...finished, ...simulated], config);
  }

  // ── Group stage: simulate groups + build bracket Match objects ─────────────
  const soccer: Record<string, number> = {};

  // Seed standings from finished group games
  for (const m of finished) {
    if (m.stage !== 'GROUP' || !m.winner) continue;
    soccer[m.homeAbbr] = soccer[m.homeAbbr] ?? 0;
    soccer[m.awayAbbr] = soccer[m.awayAbbr] ?? 0;
    if (m.winner === 'home')       soccer[m.homeAbbr] += 3;
    else if (m.winner === 'away')  soccer[m.awayAbbr] += 3;
    else { soccer[m.homeAbbr]++; soccer[m.awayAbbr]++; }
  }

  // Simulate pending group matches → fake finished Match objects
  const simGroupMatches: Match[] = [];
  for (const m of pending) {
    if (m.stage !== 'GROUP' || !m.homeAbbr || !m.awayAbbr) continue;
    const outcome = simulateOutcome(m.homeAbbr, m.awayAbbr, 'GROUP');
    soccer[m.homeAbbr] = soccer[m.homeAbbr] ?? 0;
    soccer[m.awayAbbr] = soccer[m.awayAbbr] ?? 0;
    if (outcome === 'home')       soccer[m.homeAbbr] += 3;
    else if (outcome === 'away')  soccer[m.awayAbbr] += 3;
    else { soccer[m.homeAbbr]++; soccer[m.awayAbbr]++; }
    simGroupMatches.push({
      ...m,
      status: 'finished',
      winner: outcome,
      homeScore: outcome === 'home' ? 1 : 0,
      awayScore: outcome === 'away' ? 1 : 0,
    });
  }

  // Bracket simulation → fake finished Match objects per round
  const qualifiers = determineQualifiers(groups, soccer);
  let bracket = shuffle(qualifiers);
  const bracketMatches: Match[] = [];
  let idx = 0;

  for (const stage of KO_STAGES) {
    const winners: string[] = [];
    for (let i = 0; i + 1 < bracket.length; i += 2) {
      const home = bracket[i];
      const away = bracket[i + 1];
      const outcome = simulateOutcome(home, away, stage);
      winners.push(outcome === 'home' ? home : away);
      bracketMatches.push({
        id: `sim-bracket-${idx++}`,
        date: '2026-07-01T00:00:00Z',
        stage,
        homeAbbr: home,
        awayAbbr: away,
        homeScore: outcome === 'home' ? 1 : 0,
        awayScore: outcome === 'away' ? 1 : 0,
        status: 'finished',
        winner: outcome,
      });
    }
    bracket = winners;
  }

  return calculateDrafterTotals([...finished, ...simGroupMatches, ...bracketMatches], config);
}

/**
 * Run numSims full-tournament simulations; return each drafter's win probability (0–1).
 *
 * Uses the same two-mode logic as runSingleSim (via runOnceFull) so both functions
 * stay in sync as the tournament progresses through group stage → knockout rounds.
 * bracketIsReal is computed once per batch for efficiency.
 *
 * Pass `config` / `byAbbr` to score a custom draft roster (e.g. Euro debug roster).
 */
export function runMonteCarlo(
  allMatches: Match[],
  numSims = 50_000,
  config: typeof DRAFT_CONFIG = DRAFT_CONFIG,
  byAbbr: Map<string, string> = DRAFTER_BY_ABBR
): Record<string, number> {
  const groups = buildGroups(allMatches);
  const bracketIsReal = knockoutBracketIsReal(allMatches);

  const wins: Record<string, number> = {};
  config.forEach(d => { wins[d.id] = 0; });

  for (let i = 0; i < numSims; i++) {
    const pts = runOnceFull(allMatches, groups, bracketIsReal, config, byAbbr);
    const max = Math.max(...Object.values(pts));
    const leaders = Object.entries(pts)
      .filter(([, v]) => v === max)
      .map(([k]) => k);
    for (const id of leaders) wins[id] += 1 / leaders.length;
  }

  const probs: Record<string, number> = {};
  config.forEach(d => { probs[d.id] = (wins[d.id] ?? 0) / numSims; });
  return probs;
}
