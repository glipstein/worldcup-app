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

// ─── Group structure ──────────────────────────────────────────────────────────

/**
 * Derive group membership from the group-stage match schedule using Union-Find.
 * Any two teams that play each other in the group stage end up in the same group.
 * Returns an array of groups, each group being an array of ESPN abbreviations.
 */
function buildGroups(allMatches: Match[]): string[][] {
  const parent = new Map<string, string>();

  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x);
    const p = parent.get(x)!;
    if (p !== x) parent.set(x, find(p)); // path compression
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
 * Determine the 32 teams that advance to the knockout stage.
 * Top 2 per group advance automatically; the 8 best 3rd-place finishers also advance.
 * Tiebreaker: team strength rating (simpler than goal difference across 50k runs).
 *
 * @param groups   Array of groups (each group = array of ESPN abbreviations)
 * @param soccer   Soccer-points map (W=3, D=1, L=0) accumulated from all group matches
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

  // Best 8 third-place teams
  thirdPlace.sort((a, b) => {
    const pd = b.pts - a.pts;
    return pd !== 0 ? pd : getStrength(b.abbr) - getStrength(a.abbr);
  });

  return [...top2, ...thirdPlace.slice(0, 8).map(t => t.abbr)];
}

// ─── Fast path for Monte Carlo (no object allocation for Match) ───────────────

function runOnceFull(
  allMatches: Match[],
  groups: string[][]
): Record<string, number> {
  const poolPts: Record<string, number> = {};
  DRAFT_CONFIG.forEach(d => { poolPts[d.id] = 0; });

  // Soccer points (W=3,D=1,L=0) for group standings
  const soccer: Record<string, number> = {};

  // 1. Finished matches — score pool points & seed group standings
  for (const m of allMatches) {
    if (m.status !== 'finished' || !m.winner) continue;

    for (const abbr of [m.homeAbbr, m.awayAbbr]) {
      const id = DRAFTER_BY_ABBR.get(abbr);
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

  // 2. Simulate pending GROUP matches
  for (const m of allMatches) {
    if (m.status === 'finished' || m.stage !== 'GROUP') continue;
    if (!m.homeAbbr || !m.awayAbbr) continue;

    const outcome = simulateOutcome(m.homeAbbr, m.awayAbbr, 'GROUP');

    for (const abbr of [m.homeAbbr, m.awayAbbr]) {
      const id = DRAFTER_BY_ABBR.get(abbr);
      if (id) poolPts[id] += fastMatchPts(abbr, m.homeAbbr, outcome, 'GROUP');
    }

    soccer[m.homeAbbr] = soccer[m.homeAbbr] ?? 0;
    soccer[m.awayAbbr] = soccer[m.awayAbbr] ?? 0;
    if (outcome === 'home')       soccer[m.homeAbbr] += 3;
    else if (outcome === 'away')  soccer[m.awayAbbr] += 3;
    else { soccer[m.homeAbbr]++; soccer[m.awayAbbr]++; }
  }

  // 3. Determine 32 qualifiers from simulated group standings
  const qualifiers = determineQualifiers(groups, soccer);

  // 4. Simulate full knockout bracket (random draw each time)
  //    32 → R32 → 16 → R16 → 8 → QF → 4 → SF → 2 → Final → champion
  const KO_STAGES: Stage[] = [
    'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL',
  ];

  let bracket = shuffle(qualifiers); // random draw each simulation

  for (const stage of KO_STAGES) {
    const winners: string[] = [];
    for (let i = 0; i + 1 < bracket.length; i += 2) {
      const home = bracket[i];
      const away = bracket[i + 1];
      const outcome = simulateOutcome(home, away, stage);
      const winner = outcome === 'home' ? home : away;

      // Award win points to drafted winner; loser gets 0 in knockout
      const winnerId = DRAFTER_BY_ABBR.get(winner);
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
 * Strategy:
 *   • If ESPN has no knockout matches scheduled yet (group stage / pre-tournament):
 *     simulate all group games → derive 32 qualifiers → run a full bracket.
 *   • If ESPN has knockout matches (bracket is partly known):
 *     simulate pending ESPN matches directly (existing behaviour).
 */
export function runSingleSim(allMatches: Match[]): DrafterTotals[] {
  const groups = buildGroups(allMatches);
  const finished = allMatches.filter(m => m.status === 'finished');
  const pending  = allMatches.filter(m => m.status !== 'finished');

  // Detect whether ESPN has knockout matches with real (known) teams.
  // ESPN pre-schedules the full bracket with placeholder abbreviations (e.g. "TBD")
  // before teams are determined — those must not trigger this flag.
  const hasEspnKnockout = allMatches.some(
    m => m.stage !== 'GROUP' && m.stage !== 'THIRD_PLACE'
      && (m.homeAbbr in TEAM_STRENGTH)
      && (m.awayAbbr in TEAM_STRENGTH)
  );

  if (!hasEspnKnockout && groups.length > 0) {
    // ── Full bracket simulation ───────────────────────────────────────────────
    const soccer: Record<string, number> = {};

    // Seed soccer points from finished group games
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

    // Determine 32 qualifiers
    const qualifiers = determineQualifiers(groups, soccer);

    // Simulate bracket → fake finished Match objects per round
    let bracket = shuffle(qualifiers);
    const KO_STAGES: Stage[] = [
      'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL',
    ];
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

    return calculateDrafterTotals([...finished, ...simGroupMatches, ...bracketMatches]);
  }

  // ── Fallback: ESPN-scheduled path (knockout bracket already partially known) ──
  // Simulate pending ESPN matches (group + any known knockout rounds).
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

  return calculateDrafterTotals([...finished, ...simulated]);
}

/**
 * Run numSims full-tournament simulations and return each drafter's win probability (0–1).
 *
 * Each iteration:
 *   1. Scores finished matches (real results)
 *   2. Simulates remaining group games
 *   3. Derives the 32 qualifiers from simulated group standings
 *   4. Runs a complete random-draw knockout bracket (R32 → Final)
 *
 * Simplifying assumptions:
 *   • Bracket draw is random each sim (not the official WC 2026 bracket seeding)
 *   • Group-stage tiebreaks use team strength, not goal difference
 *   • Extra time / penalties collapsed into a single win probability
 */
export function runMonteCarlo(
  allMatches: Match[],
  numSims = 50_000
): Record<string, number> {
  const groups = buildGroups(allMatches); // derived once, reused every sim
  const wins: Record<string, number> = {};
  DRAFT_CONFIG.forEach(d => { wins[d.id] = 0; });

  for (let i = 0; i < numSims; i++) {
    const pts = runOnceFull(allMatches, groups);
    const max = Math.max(...Object.values(pts));
    const leaders = Object.entries(pts)
      .filter(([, v]) => v === max)
      .map(([k]) => k);
    // Split win credit equally on ties
    for (const id of leaders) wins[id] += 1 / leaders.length;
  }

  const probs: Record<string, number> = {};
  DRAFT_CONFIG.forEach(d => { probs[d.id] = (wins[d.id] ?? 0) / numSims; });
  return probs;
}
