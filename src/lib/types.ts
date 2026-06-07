export type Stage =
  | 'GROUP'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'THIRD_PLACE'
  | 'FINAL';

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface Match {
  id: string;
  date: string;       // ISO date string
  stage: Stage;
  group?: string;     // "Group A" etc., only for GROUP stage
  homeAbbr: string;   // ESPN 3-letter code
  awayAbbr: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  winner: 'home' | 'away' | 'draw' | null;
}

export interface TeamRow {
  espnAbbr: string;
  drafterId: string;
  flag: string;
  name: string;
  /** Points per group game [game1, game2, game3]; null = unplayed or not reached */
  groupGames: [number | null, number | null, number | null];
  roundOf32: number | null;
  roundOf16: number | null;
  quarterFinal: number | null;
  semiFinal: number | null;
  final: number | null;
  total: number;
  eliminated: boolean;
}

export interface DrafterTotals {
  id: string;
  name: string;
  color: string;
  total: number;
  teams: TeamRow[];
}

export interface SimResult {
  mode: 'single' | 'montecarlo';
  /** Single-sim: full per-team breakdown (feeds directly into PointsTable) */
  drafterTotals?: DrafterTotals[];
  /** MC: win probability 0–1 per drafter id */
  winProbabilities?: Record<string, number>;
}
