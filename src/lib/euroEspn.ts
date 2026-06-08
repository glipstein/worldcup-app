/**
 * Fetches UEFA Euro 2024 match data from the ESPN API.
 * Used exclusively by the debug page — not part of the production WC 2026 data path.
 *
 * Also exports `applyTimeCutoff` which takes a full set of completed matches and
 * makes matches after the cutoff date appear "scheduled" (no score/winner).
 * This powers the debug page's time-travel feature.
 */

import type { Match } from './types';
import { fetchMatches } from './espn';

// UEFA Euro 2024: June 14 – July 14, 2024
const EURO_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.euro/scoreboard';

const EURO_DATE_CHUNKS = [
  '20240614-20240620', // Group stage MD1
  '20240621-20240627', // Group stage MD2 + MD3
  '20240628-20240704', // Round of 16
  '20240705-20240714', // Quarter Finals + Semi Finals + Final
];

/** Fetch all Euro 2024 matches from ESPN. Throws on API error. */
export async function fetchEuroMatches(): Promise<Match[]> {
  return fetchMatches(EURO_BASE, EURO_DATE_CHUNKS);
}

// ─── Time-travel milestones ───────────────────────────────────────────────────

export interface Milestone {
  label: string;
  /** ISO date string cutoff; matches after this date become "scheduled". null = show all. */
  cutoff: string | null;
}

export const EURO_MILESTONES: Milestone[] = [
  { label: 'Pre-tournament',   cutoff: '2024-06-13T23:59:00Z' },
  { label: 'After MD1',        cutoff: '2024-06-20T00:00:00Z' },
  { label: 'After MD2',        cutoff: '2024-06-26T00:00:00Z' },
  { label: 'After Groups',     cutoff: '2024-06-28T00:00:00Z' },
  { label: 'After Round of 16',cutoff: '2024-07-03T00:00:00Z' },
  { label: 'After QF',         cutoff: '2024-07-07T00:00:00Z' },
  { label: 'After SF',         cutoff: '2024-07-11T00:00:00Z' },
  { label: 'Complete',         cutoff: null },
];

/**
 * Apply a time cutoff to a list of matches.
 *
 * Matches after `cutoffISO` are reset to scheduled status (score/winner cleared),
 * simulating what the app would have shown at that point in the tournament.
 * Pass `null` as cutoffISO to return all matches unchanged.
 */
export function applyTimeCutoff(matches: Match[], cutoffISO: string | null): Match[] {
  if (cutoffISO === null) return matches;
  return matches.map(m => {
    if (m.date > cutoffISO) {
      return {
        ...m,
        status: 'scheduled' as const,
        homeScore: null,
        awayScore: null,
        winner: null,
      };
    }
    return m;
  });
}
