import type { Match, Stage, DrafterTotals } from './types';
import { DRAFT_CONFIG, DRAFTER_BY_ABBR } from '../config/draft';
import { getStrength, TEAM_STRENGTH } from './teamStrength';
import { MATCH_ODDS, MARKET_STRENGTH } from './matchOdds';
import { calculateDrafterTotals } from './scoring';

// ─── Strength resolver ───────────────────────────────────────────────────────

// Matches the STRENGTH_FLOOR constant in scripts/fetch-match-odds.mjs.
const MARKET_FLOOR = 10;

// Scale denominator for floor-tier teams.  Set slightly above the highest Elo
// value found among WC 2026 teams that sit at the market floor (~59, Paraguay).
// Result: floor teams map into [1, MARKET_FLOOR-1], always below the lowest
// above-floor market calibration (Korea/Canada = 11).
const FLOOR_ELO_SCALE = 60;

/**
 * Returns the best strength estimate for a team, resolved in three tiers:
 *
 *  Tier 1 — above-floor market signal (e.g. Belgium 51, Colombia 49):
 *    Use MARKET_STRENGTH directly.  Covers ~25 of the 48 WC teams.
 *
 *  Tier 2 — at-floor market signal (e.g. Algeria, Scotland, Iran, Qatar):
 *    Polymarket groups these as "can't win the tournament" but their
 *    per-match quality still differs meaningfully.  Scale their Elo value
 *    into [1, MARKET_FLOOR-1] so ordering is preserved and they stay
 *    below all Tier 1 teams (minimum Tier 1 = Korea/Canada = 11).
 *      formula:  max(1, round(elo × 9 / 60))
 *      results:  Algeria/Iran ≈ 8, Scotland ≈ 7, Egypt/Czechia ≈ 6,
 *                Ghana ≈ 2, Qatar/Curaçao ≈ 2
 *
 *  Tier 3 — not in the Polymarket winner market (non-WC teams):
 *    Use raw Elo directly.  These shouldn't appear in live simulations
 *    but are kept as a safety fallback.
 *
 * Note: match-specific MATCH_ODDS take priority over this function entirely;
 * getEffectiveStrength is only reached when no per-match market exists.
 */
function getEffectiveStrength(abbr: string): number {
  const market = MARKET_STRENGTH[abbr];

  if (market !== undefined) {
    if (market > MARKET_FLOOR) return market;          // Tier 1: clear signal
    // Tier 2: at floor — scale Elo into [1, MARKET_FLOOR-1]
    const elo = getStrength(abbr);
    return Math.max(1, Math.round(elo * (MARKET_FLOOR - 1) / FLOOR_ELO_SCALE));
  }

  return getStrength(abbr);                            // Tier 3: non-WC team
}

// ─── Probability model ────────────────────────────────────────────────────────

/**
 * Per-match logistic steepness D in  P(home) = 1 / (1 + 10^((s2 - s1) / D)).
 *
 * Larger D ⇒ flatter ⇒ more parity ⇒ favorites win individual matches by a
 * smaller margin, so championship probability spreads out instead of piling
 * onto the top seeds. Calibrated against the Polymarket world-cup-winner market
 * (see scripts/calibrate-d.ts) so the *simulated* champion odds reproduce the
 * market — keeping the team-odds chart a meaningful realism check rather than
 * an inflated favorite-heavy curve.
 *
 * matchModelD is mutable solely so the calibration script can sweep candidate
 * values; all production code paths run at DEFAULT_MATCH_D.
 */
// D=110 calibrated 2026-06-10 against the Polymarket winner market: weighted
// mean abs error 0.4% across the top ~26 teams (vs 3.5% at the old D=50, which
// inflated Spain to ~25% against a ~16% market). Re-run scripts/calibrate-d.ts
// if the strength model or market structure changes materially.
const DEFAULT_MATCH_D = 110;
let matchModelD = DEFAULT_MATCH_D;

/** Override the per-match steepness D. Used only by scripts/calibrate-d.ts. */
export function setMatchModelD(d: number): void { matchModelD = d; }
/** Current per-match steepness D. */
export function getMatchModelD(): number { return matchModelD; }

/**
 * Match outcome simulator — two-tier probability source:
 *
 * Tier 1 — Polymarket market odds (MATCH_ODDS lookup):
 *   When a market exists for this exact fixture (key = "HOMEABBR_AWAYABBR"),
 *   we use those probabilities directly.  They are pre-normalized to sum to 1.0
 *   by scripts/fetch-match-odds.mjs and reflect the full wisdom-of-crowd market.
 *   For knockout rounds, the draw probability is redistributed proportionally
 *   between home/away (no draws in knockout — ET/pens resolve to one winner,
 *   and outright Polymarket knockout markets already bake that in).
 *
 * Tier 2 — Elo-logistic fallback (D=50):
 *   Used when no Polymarket market exists: hypothetical bracket paths during the
 *   group stage simulation, very early group games not yet on Polymarket, or
 *   any match whose slug couldn't be resolved.
 *   Formula: P(home wins) = 1 / (1 + 10^((s2 - s1) / 50))
 *   Group stage uses a flat 25% draw rate atop the logistic win probability.
 */
function simulateOutcome(
  homeAbbr: string,
  awayAbbr: string,
  stage: Stage
): 'home' | 'away' | 'draw' {
  // ── Tier 1: Polymarket match-specific odds ────────────────────────────────
  const mkt = MATCH_ODDS[`${homeAbbr}_${awayAbbr}`];
  if (mkt) {
    const r = Math.random();
    if (stage !== 'GROUP') {
      // Knockout: no draws — redistribute pDraw proportionally to home/away
      const pHomeKO = mkt.pHome / (mkt.pHome + mkt.pAway);
      return r < pHomeKO ? 'home' : 'away';
    }
    // Group stage: use 3-way odds directly
    if (r < mkt.pHome) return 'home';
    if (r < mkt.pHome + mkt.pDraw) return 'draw';
    return 'away';
  }

  // ── Tier 2: market-calibrated strength (or Elo if no market data) ────────
  const s1 = getEffectiveStrength(homeAbbr);
  const s2 = getEffectiveStrength(awayAbbr);
  const D = matchModelD;
  const pHome = 1 / (1 + Math.pow(10, (s2 - s1) / D));
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
      return pd !== 0 ? pd : getEffectiveStrength(b) - getEffectiveStrength(a);
    });
    if (sorted[0]) top2.push(sorted[0]);
    if (sorted[1]) top2.push(sorted[1]);
    if (sorted[2]) thirdPlace.push({ abbr: sorted[2], pts: soccer[sorted[2]] ?? 0 });
  }

  thirdPlace.sort((a, b) => {
    const pd = b.pts - a.pts;
    return pd !== 0 ? pd : getEffectiveStrength(b.abbr) - getEffectiveStrength(a.abbr);
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
): { poolPts: Record<string, number>; champion: string | null } {
  const poolPts: Record<string, number> = {};
  config.forEach(d => { poolPts[d.id] = 0; });

  if (bracketIsReal) {
    // ── Knockout stage: simulate directly from ESPN schedule ────────────────
    let champion: string | null = null;
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

      // The FINAL's winner is the tournament champion. (Early in the knockout
      // rounds ESPN may still list placeholder teams for the FINAL, in which
      // case champion stays whatever the latest resolved final showed / null.)
      if (m.stage === 'FINAL' && outcome !== 'draw') {
        champion = outcome === 'home' ? m.homeAbbr : m.awayAbbr;
      }
    }
    return { poolPts, champion };
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

  // After the FINAL the bracket collapses to a single surviving team.
  const champion = bracket.length === 1 ? bracket[0] : null;

  return { poolPts, champion };
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
  return runMonteCarloFull(allMatches, numSims, config, byAbbr).drafters;
}

/**
 * Like runMonteCarlo, but also returns each team's probability of winning the
 * tournament (champion share), derived from the same batch of simulations.
 *
 * Returns:
 *   drafters — { drafterId → P(this drafter wins the pool) }, sums to ~1.0
 *   teams    — { teamAbbr  → P(this team wins the tournament) }, sums to ~1.0
 *              across teams that produced a champion in the batch.
 *
 * Used by SimulatePanel (drafters only) and scripts/snapshot-odds.ts (both),
 * which records a daily data point for the trend charts.
 */
export function runMonteCarloFull(
  allMatches: Match[],
  numSims = 50_000,
  config: typeof DRAFT_CONFIG = DRAFT_CONFIG,
  byAbbr: Map<string, string> = DRAFTER_BY_ABBR
): { drafters: Record<string, number>; teams: Record<string, number> } {
  const groups = buildGroups(allMatches);
  const bracketIsReal = knockoutBracketIsReal(allMatches);

  const wins: Record<string, number> = {};
  config.forEach(d => { wins[d.id] = 0; });

  const champWins: Record<string, number> = {};
  let champTotal = 0;

  for (let i = 0; i < numSims; i++) {
    const { poolPts, champion } = runOnceFull(
      allMatches, groups, bracketIsReal, config, byAbbr
    );

    const max = Math.max(...Object.values(poolPts));
    const leaders = Object.entries(poolPts)
      .filter(([, v]) => v === max)
      .map(([k]) => k);
    for (const id of leaders) wins[id] += 1 / leaders.length;

    if (champion) {
      champWins[champion] = (champWins[champion] ?? 0) + 1;
      champTotal += 1;
    }
  }

  const drafters: Record<string, number> = {};
  config.forEach(d => { drafters[d.id] = (wins[d.id] ?? 0) / numSims; });

  // Normalize champion shares over the sims that produced a champion so the
  // team probabilities sum to 1.0 even if some sims had a placeholder final.
  const teams: Record<string, number> = {};
  const denom = champTotal || numSims;
  for (const [abbr, n] of Object.entries(champWins)) {
    teams[abbr] = n / denom;
  }

  return { drafters, teams };
}
