import type { Match, Stage, MatchStatus } from './types';

// ─── Raw ESPN API types ───────────────────────────────────────────────────────

interface EspnTeam {
  abbreviation: string;
  displayName: string;
}

interface EspnCompetitor {
  homeAway: 'home' | 'away';
  score: string;
  winner?: boolean;
  team: EspnTeam;
}

interface EspnStatusType {
  state: 'pre' | 'in' | 'post';
  completed: boolean;
  name: string;
}

interface EspnNote {
  type: string;
  headline: string;
}

interface EspnEvent {
  id: string;
  date: string;
  season: {
    year: number;
    type: number;
    slug: string;
  };
  status: { type: EspnStatusType };
  competitions: Array<{
    competitors: EspnCompetitor[];
    notes?: EspnNote[];
  }>;
}

// ─── Stage mapping ────────────────────────────────────────────────────────────

function mapSlugToStage(slug: string): Stage {
  const map: Record<string, Stage> = {
    'group-stage':    'GROUP',
    'round-of-32':    'ROUND_OF_32',
    'round-of-16':    'ROUND_OF_16',
    'quarterfinals':  'QUARTER_FINAL',
    'quarterfinal':   'QUARTER_FINAL',
    'semifinals':     'SEMI_FINAL',
    'semifinal':      'SEMI_FINAL',
    'third-place':      'THIRD_PLACE',
    '3rd-place-match':  'THIRD_PLACE',  // ESPN WC 2026 actual slug
    'final':            'FINAL',
  };
  return map[slug.toLowerCase()] ?? 'GROUP';
}

function mapStatusState(state: string, completed: boolean): MatchStatus {
  if (completed || state === 'post') return 'finished';
  if (state === 'in') return 'live';
  return 'scheduled';
}

// ─── Parse ESPN event → Match ─────────────────────────────────────────────────

function parseEvent(event: EspnEvent): Match | null {
  const comp = event.competitions[0];
  if (!comp) return null;

  const home = comp.competitors.find(c => c.homeAway === 'home');
  const away = comp.competitors.find(c => c.homeAway === 'away');
  if (!home || !away) return null;

  const statusType = event.status.type;
  const status = mapStatusState(statusType.state, statusType.completed);
  const isScored = status === 'finished' || status === 'live';

  const homeScore = isScored ? parseInt(home.score, 10) : null;
  const awayScore = isScored ? parseInt(away.score, 10) : null;

  let winner: Match['winner'] = null;
  if (status === 'finished' && homeScore !== null && awayScore !== null) {
    if (homeScore > awayScore) winner = 'home';
    else if (awayScore > homeScore) winner = 'away';
    else winner = 'draw';
  }

  // Extract group label from notes (e.g. "Group A")
  const note = comp.notes?.find(n => n.type === 'event')?.headline ?? '';
  const groupMatch = note.match(/group\s+([A-L])/i);

  return {
    id: event.id,
    date: event.date,
    stage: mapSlugToStage(event.season.slug),
    group: groupMatch ? `Group ${groupMatch[1].toUpperCase()}` : undefined,
    homeAbbr: home.team.abbreviation,
    awayAbbr: away.team.abbreviation,
    homeScore,
    awayScore,
    status,
    winner,
  };
}

// ─── Fetching ─────────────────────────────────────────────────────────────────

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

// WC 2026: June 11 – July 19. Fetch in 6 weekly chunks to stay within the
// API's apparent per-call event limit (~12-16 events per response).
const DATE_CHUNKS = [
  '20260611-20260617',
  '20260618-20260624',
  '20260625-20260701',
  '20260702-20260708',
  '20260709-20260715',
  '20260716-20260719',
];

/**
 * Generic match fetcher for any ESPN soccer scoreboard endpoint.
 * Fetches all date chunks in parallel, deduplicates by event ID, returns sorted matches.
 */
export async function fetchMatches(base: string, chunks: string[]): Promise<Match[]> {
  const allEvents = await Promise.all(
    chunks.map(async dates => {
      const url = `${base}?dates=${dates}&limit=100`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`ESPN API ${res.status} for ${dates}`);
      const data = await res.json() as { events?: EspnEvent[] };
      return data.events ?? [];
    })
  );

  const seen = new Set<string>();
  const matches: Match[] = [];
  for (const event of allEvents.flat()) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    const match = parseEvent(event);
    if (match) matches.push(match);
  }
  matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return matches;
}

/**
 * Fetches all WC 2026 matches from ESPN in parallel weekly chunks.
 */
export async function fetchAllMatches(): Promise<Match[]> {
  return fetchMatches(BASE, DATE_CHUNKS);
}
