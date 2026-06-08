import type { Match, Stage, TeamRow, DrafterTotals } from './types';
import { DRAFT_CONFIG, DRAFTER_BY_ABBR } from '../config/draft';

// ─── Points per result per stage ─────────────────────────────────────────────

const STAGE_PTS: Record<Stage, { win: number; draw: number; loss: number }> = {
  GROUP:         { win: 1,   draw: 0.5, loss: 0 },
  ROUND_OF_32:   { win: 2,   draw: 0,   loss: 0 },
  ROUND_OF_16:   { win: 3,   draw: 0,   loss: 0 },
  QUARTER_FINAL: { win: 4,   draw: 0,   loss: 0 },
  SEMI_FINAL:    { win: 5,   draw: 0,   loss: 0 },
  THIRD_PLACE:   { win: 0,   draw: 0,   loss: 0 }, // no pool points
  FINAL:         { win: 6,   draw: 0,   loss: 0 },
};

function pts(stage: Stage, result: 'win' | 'draw' | 'loss'): number {
  return STAGE_PTS[stage][result];
}

function resultFor(abbr: string, match: Match): 'win' | 'draw' | 'loss' | null {
  if (!match.winner) return null;
  if (match.winner === 'draw') return 'draw';
  const isHome = match.homeAbbr === abbr;
  return (isHome ? match.winner === 'home' : match.winner === 'away') ? 'win' : 'loss';
}

// ─── Build TeamRow for one drafted team ───────────────────────────────────────

function buildTeamRow(
  espnAbbr: string,
  drafterId: string,
  flag: string,
  name: string,
  allMatches: Match[]
): TeamRow {
  const teamMatches = allMatches.filter(
    m => m.homeAbbr === espnAbbr || m.awayAbbr === espnAbbr
  );

  const groupMatches = teamMatches
    .filter(m => m.stage === 'GROUP')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const groupGames: [number | null, number | null, number | null] = [null, null, null];
  for (let i = 0; i < 3; i++) {
    const m = groupMatches[i];
    if (!m || m.status !== 'finished') continue;
    const r = resultFor(espnAbbr, m);
    if (r) groupGames[i] = pts('GROUP', r);
  }

  function knockoutPts(stage: Stage): number | null {
    const m = teamMatches.find(m => m.stage === stage);
    if (!m) return null;                      // never reached this round
    if (m.status !== 'finished') return null; // scheduled / live → show dash
    const r = resultFor(espnAbbr, m);
    return r ? pts(stage, r) : null;
  }

  const roundOf32   = knockoutPts('ROUND_OF_32');
  const roundOf16   = knockoutPts('ROUND_OF_16');
  const quarterFinal = knockoutPts('QUARTER_FINAL');
  const semiFinal   = knockoutPts('SEMI_FINAL');
  const final       = knockoutPts('FINAL');

  const allGroupDone = groupMatches.filter(m => m.status === 'finished').length === 3;
  const inKnockout   = teamMatches.some(m => m.stage !== 'GROUP' && m.stage !== 'THIRD_PLACE');
  const eliminated   = allGroupDone && !inKnockout;

  const total = ([...groupGames, roundOf32, roundOf16, quarterFinal, semiFinal, final] as (number | null)[])
    .reduce<number>((sum, v) => sum + (v ?? 0), 0);

  return {
    espnAbbr,
    drafterId,
    flag,
    name,
    groupGames,
    roundOf32,
    roundOf16,
    quarterFinal,
    semiFinal,
    final,
    total,
    eliminated,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Calculate per-drafter totals from match data.
 * Pass a custom `config` to use a different draft (e.g. for the debug page's Euro roster).
 * Defaults to the WC 2026 draft config.
 */
export function calculateDrafterTotals(
  matches: Match[],
  config: typeof DRAFT_CONFIG = DRAFT_CONFIG
): DrafterTotals[] {
  return config.map(drafter => {
    const teams = drafter.teams.map(team =>
      buildTeamRow(team.espnAbbr, drafter.id, team.flag, team.name, matches)
    );
    const total = teams.reduce((s, t) => s + t.total, 0);
    return { id: drafter.id, name: drafter.name, color: drafter.color, total, teams };
  });
}

/** Map of espnAbbr → drafter color, for any match-level display */
export function teamColorMap(): Map<string, string> {
  const map = new Map<string, string>();
  DRAFT_CONFIG.forEach(d => d.teams.forEach(t => map.set(t.espnAbbr, d.color)));
  return map;
}

export { DRAFTER_BY_ABBR, pts, resultFor };
