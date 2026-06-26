import { useMemo } from 'react';
import type { Match, Stage } from '../lib/types';
import { DRAFTER_BY_ABBR, DRAFTER_BY_ID } from '../config/draft';
import type { DrafterConfig } from '../config/draft';
import Flag from './Flag';

interface Props {
  matches: Match[];
}

// ─── Group standings ──────────────────────────────────────────────────────────

interface TeamStanding {
  abbr: string;
  drafterColor: string | null;
  drafterName: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  pts: number;
}

function computeGroupStandings(matches: Match[]): Map<string, TeamStanding[]> {
  const groupMatches = matches.filter(m => m.stage === 'GROUP');
  if (groupMatches.length === 0) return new Map();

  // Union-Find: cluster teams that played each other into the same group.
  // ESPN stopped returning group notes (notes: []) so we can't rely on m.group;
  // this approach works purely from the match schedule.
  const parent = new Map<string, string>();
  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x);
    const p = parent.get(x)!;
    if (p !== x) parent.set(x, find(p));
    return parent.get(x)!;
  }
  for (const m of groupMatches) {
    const rx = find(m.homeAbbr), ry = find(m.awayAbbr);
    if (rx !== ry) parent.set(rx, ry);
  }

  // Build group → member set
  const clusters = new Map<string, Set<string>>();
  for (const [team] of parent) {
    const root = find(team);
    if (!clusters.has(root)) clusters.set(root, new Set());
    clusters.get(root)!.add(team);
  }

  // Sort clusters by earliest match date → assign Group A, B, C … labels in
  // the same chronological order FIFA scheduled them.
  const firstDate = new Map<string, number>();
  for (const m of groupMatches) {
    const root = find(m.homeAbbr);
    const t = new Date(m.date).getTime();
    if (!firstDate.has(root) || t < firstDate.get(root)!) firstDate.set(root, t);
  }
  const sortedRoots = [...clusters.keys()].sort(
    (a, b) => (firstDate.get(a) ?? 0) - (firstDate.get(b) ?? 0)
  );

  const result = new Map<string, TeamStanding[]>();

  sortedRoots.forEach((root, i) => {
    // Prefer the official ESPN label (m.group) if any match in this cluster has one.
    let label: string | undefined;
    for (const m of groupMatches) {
      if (clusters.get(root)!.has(m.homeAbbr) && m.group) { label = m.group; break; }
    }
    const groupName = label ?? `Group ${String.fromCharCode(65 + i)}`;

    const teams = clusters.get(root)!;
    const standingMap = new Map<string, TeamStanding>();
    for (const abbr of teams) {
      const drafterId = DRAFTER_BY_ABBR.get(abbr);
      const drafter = drafterId ? DRAFTER_BY_ID.get(drafterId) : undefined;
      standingMap.set(abbr, {
        abbr,
        drafterColor: drafter?.color ?? null,
        drafterName: drafter?.name ?? null,
        played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0,
      });
    }

    for (const m of groupMatches) {
      if (!teams.has(m.homeAbbr) || !teams.has(m.awayAbbr)) continue;
      if (m.status !== 'finished' || m.homeScore === null || m.awayScore === null) continue;
      const home = standingMap.get(m.homeAbbr)!;
      const away = standingMap.get(m.awayAbbr)!;
      home.played++; away.played++;
      home.gf += m.homeScore; home.ga += m.awayScore;
      away.gf += m.awayScore; away.ga += m.homeScore;
      if (m.winner === 'home') { home.won++; home.pts += 3; away.lost++; }
      else if (m.winner === 'away') { away.won++; away.pts += 3; home.lost++; }
      else { home.drawn++; home.pts += 1; away.drawn++; away.pts += 1; }
    }

    const sorted = [...standingMap.values()].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const gd = (b.gf - b.ga) - (a.gf - a.ga);
      if (gd !== 0) return gd;
      return b.gf - a.gf;
    });
    result.set(groupName, sorted);
  });

  return result;
}

// Best 8 of 12 third-place teams advance (WC 2026 format).
function advancingThirdPlaceSet(standings: Map<string, TeamStanding[]>): Set<string> {
  const thirds: TeamStanding[] = [];
  for (const teams of standings.values()) {
    if (teams.length >= 3) thirds.push(teams[2]);
  }
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gd = (b.gf - b.ga) - (a.gf - a.ga);
    if (gd !== 0) return gd;
    return b.gf - a.gf;
  });
  return new Set(thirds.slice(0, 8).map(t => t.abbr));
}

// ─── Bracket match card ───────────────────────────────────────────────────────

const STAGE_LABELS: Partial<Record<Stage, string>> = {
  ROUND_OF_32:   'Round of 32',
  ROUND_OF_16:   'Round of 16',
  QUARTER_FINAL: 'Quarterfinals',
  SEMI_FINAL:    'Semifinals',
  FINAL:         'Final',
  THIRD_PLACE:   '3rd Place',
};

// Card height (px) used for bracket alignment math. Both BracketMatchCard and
// TBDMatchCard are rendered at exactly this height (overflow-hidden clips excess)
// so every round's cards are uniform and the centering formula stays accurate.
const CARD_H_PX = 88;
const BASE_GAP_PX = 8;

// For round index n (0=R32, 1=R16, 2=QF, …):
//   paddingTop = (2^n − 1) × U / 2   where U = CARD_H + BASE_GAP
//   gap        = 2^n × U − CARD_H
// This centers each card between the two feeder cards from the prior round.
const KO_ROUND_ORDER: Stage[] = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];

function roundAlignStyle(stage: Stage): React.CSSProperties {
  const n = KO_ROUND_ORDER.indexOf(stage);
  const U = CARD_H_PX + BASE_GAP_PX;
  if (n < 0) return { gap: `${BASE_GAP_PX}px` };           // THIRD_PLACE etc.
  const scale = 1 << n;                                     // 2^n
  return {
    paddingTop: n > 0 ? `${(scale - 1) * U / 2}px` : undefined,
    gap: `${scale * U - CARD_H_PX}px`,
  };
}

const STAGE_MATCH_COUNT: Partial<Record<Stage, number>> = {
  ROUND_OF_32:   16,
  ROUND_OF_16:   8,
  QUARTER_FINAL: 4,
  SEMI_FINAL:    2,
  FINAL:         1,
  THIRD_PLACE:   1,
};

// ESPN event IDs in correct bracket display order (top → bottom).
// Derived from the ESPN WC 2026 bracket structure (FIFA draw seeding).
// Pairs that are adjacent feed into the same match in the next round.
const BRACKET_ORDER: Partial<Record<Stage, string[]>> = {
  ROUND_OF_32: [
    // SF101 half → QF97 (via R16-M89 + R16-M90)
    '760489', '760492',  // GER/3RD + 1I/3RD  → R16-M89
    '760486', '760488',  // RSA-CAN + NED-MAR  → R16-M90
    // SF101 half → QF98 (via R16-M93 + R16-M94)
    '760496', '760497',  // 2K/2L + 1H/2J     → R16-M93
    '760494', '760493',  // USA-BIH + 1G/3RD  → R16-M94
    // SF102 half → QF99 (via R16-M91 + R16-M92)
    '760487', '760490',  // BRA-JPN + CIV/2I  → R16-M91
    '760491', '760495',  // MEX/3RD + 1L/3RD  → R16-M92
    // SF102 half → QF100 (via R16-M95 + R16-M96)
    '760500', '760499',  // ARG/2H + AUS/2G   → R16-M95
    '760498', '760501',  // SUI/3RD + 1K/3RD  → R16-M96
  ],
  ROUND_OF_16: [
    '760504', '760502',  // R16-M89 (GER/1I) + R16-M90 (RSA/NED) → QF97
    '760506', '760507',  // R16-M93 (2K/1H)  + R16-M94 (USA/1G)  → QF98
    '760503', '760505',  // R16-M91 (BRA/CIV)+ R16-M92 (MEX/1L)  → QF99
    '760508', '760509',  // R16-M95 + R16-M96                     → QF100
  ],
  QUARTER_FINAL: ['760510', '760511', '760512', '760513'],
  SEMI_FINAL:    ['760514', '760515'],
};

interface TeamSlotProps {
  abbr: string;
  score: number | null;
  drafter: DrafterConfig | null;
  won: boolean;
  finished: boolean;
}

function TeamSlot({ abbr, score, drafter, won, finished }: TeamSlotProps) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 transition-opacity
      ${finished && !won ? 'opacity-50' : ''}`}
    >
      <Flag espnAbbr={abbr} size="sm" />
      <div className="flex-1 min-w-0">
        <div className={`text-[11px] font-semibold truncate leading-tight
          ${won ? 'text-white' : 'text-slate-300'}`}
        >
          {abbr}
        </div>
        {drafter && (
          <div className="text-[9px] font-bold leading-none truncate" style={{ color: drafter.color }}>
            {drafter.name}
          </div>
        )}
      </div>
      {score !== null && (
        <span className={`text-sm font-black tabular-nums shrink-0
          ${won ? 'text-white' : 'text-slate-500'}`}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function BracketMatchCard({ match }: { match: Match }) {
  const homeDrafter = DRAFTER_BY_ID.get(DRAFTER_BY_ABBR.get(match.homeAbbr) ?? '') ?? null;
  const awayDrafter = DRAFTER_BY_ID.get(DRAFTER_BY_ABBR.get(match.awayAbbr) ?? '') ?? null;

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  const dateLabel = new Date(match.date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
  const timeLabel = new Date(match.date).toLocaleTimeString([], {
    hour: 'numeric', minute: '2-digit',
  });

  const showScore = (isFinished || isLive) && match.homeScore !== null && match.awayScore !== null;

  return (
    <div className={`rounded-lg border overflow-hidden shrink-0
      ${isLive ? 'border-green-500/60' : 'border-slate-700'} bg-slate-900`}
         style={{ height: `${CARD_H_PX}px` }}
    >
      {/* Status header */}
      <div className="flex items-center px-2 py-0.5 bg-slate-800/80 text-[10px]">
        {isLive && (
          <span className="flex items-center gap-1 text-green-400 font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        )}
        {isFinished && <span className="text-slate-500 font-medium">FT</span>}
        {!isLive && !isFinished && (
          <span className="text-slate-400">{dateLabel} · {timeLabel}</span>
        )}
      </div>

      {/* Home */}
      <TeamSlot
        abbr={match.homeAbbr}
        score={showScore ? match.homeScore : null}
        drafter={homeDrafter}
        won={match.winner === 'home'}
        finished={isFinished}
      />
      <div className="h-px bg-slate-800 mx-2" />
      {/* Away */}
      <TeamSlot
        abbr={match.awayAbbr}
        score={showScore ? match.awayScore : null}
        drafter={awayDrafter}
        won={match.winner === 'away'}
        finished={isFinished}
      />
    </div>
  );
}

// ─── TBD placeholder card ─────────────────────────────────────────────────────

function TBDMatchCard() {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden shrink-0"
         style={{ height: `${CARD_H_PX}px` }}>
      <div className="px-2 py-0.5 bg-slate-800/30 text-[10px] text-slate-700">TBD</div>
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <div className="w-5 h-3.5 rounded-sm bg-slate-800/60 shrink-0" />
        <span className="text-[11px] text-slate-700 font-semibold">—</span>
      </div>
      <div className="h-px bg-slate-800/50 mx-2" />
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <div className="w-5 h-3.5 rounded-sm bg-slate-800/60 shrink-0" />
        <span className="text-[11px] text-slate-700 font-semibold">—</span>
      </div>
    </div>
  );
}

// ─── Round column ─────────────────────────────────────────────────────────────

function RoundColumn({ stage, matches }: { stage: Stage; matches: Match[] }) {
  const done = matches.filter(m => m.status === 'finished').length;
  const expected = STAGE_MATCH_COUNT[stage] ?? matches.length;
  const order = BRACKET_ORDER[stage];

  // Build lookup by ESPN event ID for ordered rendering.
  const byId = new Map(matches.map(m => [m.id, m]));

  // For stages with a defined bracket order, render slots in that order
  // (real card if match exists, TBD otherwise). For other stages (THIRD_PLACE,
  // FINAL with no order), fall back to matches + trailing TBD padding.
  const slots: Array<Match | null> = order
    ? order.map(id => byId.get(id) ?? null)
    : [
        ...matches,
        ...Array.from({ length: Math.max(0, expected - matches.length) }, () => null),
      ];

  return (
    <div className="flex flex-col w-40 shrink-0">
      <div className="text-center pb-2">
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
          {STAGE_LABELS[stage]}
        </div>
        <div className="text-[9px] text-slate-500">
          {done}/{expected} complete
        </div>
      </div>
      <div className="flex flex-col" style={roundAlignStyle(stage)}>
        {slots.map((m, i) =>
          m ? <BracketMatchCard key={m.id} match={m} /> : <TBDMatchCard key={`tbd-${i}`} />
        )}
      </div>
    </div>
  );
}

// ─── Group table ──────────────────────────────────────────────────────────────

function GroupTable({
  group, teams, advancingThird,
}: { group: string; teams: TeamStanding[]; advancingThird: Set<string> }) {
  // Are all group games complete? (each team plays 3)
  const groupDone = teams.length === 4 && teams.every(t => t.played === 3);

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
      <div className="px-3 py-1.5 bg-slate-800/80 text-xs font-bold text-slate-300">
        {group}
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-slate-600 border-b border-slate-800">
            <th className="text-left pl-2 pr-1 py-1 font-normal">#</th>
            <th className="text-left px-1 py-1 font-normal">Team</th>
            <th className="hidden sm:table-cell px-1 py-1 text-center font-normal">P</th>
            <th className="hidden sm:table-cell px-1 py-1 text-center font-normal">W</th>
            <th className="hidden sm:table-cell px-1 py-1 text-center font-normal">D</th>
            <th className="hidden sm:table-cell px-1 py-1 text-center font-normal">L</th>
            <th className="hidden sm:table-cell px-1 py-1 text-center font-normal">GD</th>
            <th className="px-1 py-1 text-center font-semibold text-slate-400">Pts</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => {
            const autoAdvance = i < 2;
            const thirdAdvance = i === 2 && groupDone && advancingThird.has(t.abbr);
            const thirdElim = i === 2 && groupDone && !advancingThird.has(t.abbr);
            const eliminated = i === 3;

            return (
              <tr
                key={t.abbr}
                className={`border-b border-slate-800/40 last:border-0
                  ${autoAdvance ? 'bg-sky-950/40' : ''}
                  ${thirdAdvance ? 'bg-amber-950/40' : ''}`}
              >
                <td className={`pl-2 pr-1 py-1.5 font-medium
                  ${eliminated || thirdElim ? 'text-slate-600' : 'text-slate-400'}`}
                >
                  {i + 1}
                </td>
                <td className="px-1 py-1.5">
                  <div className={`flex items-center gap-1.5
                    ${eliminated || thirdElim ? 'opacity-45' : ''}`}
                  >
                    <Flag espnAbbr={t.abbr} size="sm" />
                    <div className="min-w-0">
                      <div className="text-slate-200 font-semibold text-[11px] leading-tight truncate">
                        {t.abbr}
                      </div>
                      {t.drafterColor && (
                        <div className="text-[9px] font-bold leading-none" style={{ color: t.drafterColor }}>
                          {t.drafterName}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className={`hidden sm:table-cell px-1 py-1.5 text-center tabular-nums
                  ${eliminated || thirdElim ? 'text-slate-600' : 'text-slate-400'}`}>{t.played}</td>
                <td className={`hidden sm:table-cell px-1 py-1.5 text-center tabular-nums
                  ${eliminated || thirdElim ? 'text-slate-600' : 'text-slate-400'}`}>{t.won}</td>
                <td className={`hidden sm:table-cell px-1 py-1.5 text-center tabular-nums
                  ${eliminated || thirdElim ? 'text-slate-600' : 'text-slate-400'}`}>{t.drawn}</td>
                <td className={`hidden sm:table-cell px-1 py-1.5 text-center tabular-nums
                  ${eliminated || thirdElim ? 'text-slate-600' : 'text-slate-400'}`}>{t.lost}</td>
                <td className={`hidden sm:table-cell px-1 py-1.5 text-center tabular-nums
                  ${eliminated || thirdElim ? 'text-slate-600' : 'text-slate-400'}`}>
                  {t.gf - t.ga > 0 ? '+' : ''}{t.gf - t.ga}
                </td>
                <td className={`px-1 py-1.5 text-center font-bold tabular-nums
                  ${autoAdvance || thirdAdvance ? 'text-white' : eliminated || thirdElim ? 'text-slate-600' : 'text-slate-400'}`}
                >
                  {t.pts}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main BracketTab ──────────────────────────────────────────────────────────

const KO_STAGES: Stage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL',
];

export default function BracketTab({ matches }: Props) {
  const koByStage = useMemo(() => {
    const map = new Map<Stage, Match[]>();
    for (const s of [...KO_STAGES, 'THIRD_PLACE' as Stage]) map.set(s, []);
    for (const m of matches) {
      const list = map.get(m.stage);
      if (list) list.push(m);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return map;
  }, [matches]);

  const groupStandings = useMemo(() => computeGroupStandings(matches), [matches]);
  const advancingThird = useMemo(() => advancingThirdPlaceSet(groupStandings), [groupStandings]);

  const thirdPlaceMatches = koByStage.get('THIRD_PLACE') ?? [];

  // How many groups have all 3 games done — for the 3rd-place advancing legend note
  const completedGroups = [...groupStandings.values()].filter(
    ts => ts.length === 4 && ts.every(t => t.played === 3)
  ).length;

  return (
    <div className="space-y-8">

      {/* ── Knockout bracket ── */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
          Knockout Bracket
        </h2>

        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-4 min-w-max">
            {KO_STAGES.map(stage => (
              <RoundColumn key={stage} stage={stage} matches={koByStage.get(stage) ?? []} />
            ))}
            {thirdPlaceMatches.length > 0 && (
              <>
                <div className="w-px bg-slate-800 self-stretch" />
                <RoundColumn stage="THIRD_PLACE" matches={thirdPlaceMatches} />
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Group stage tables ── */}
      {groupStandings.size > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4 px-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Group Stage
            </h2>
            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-sky-950 border border-sky-800" />
                Auto-advance
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-amber-950 border border-amber-800" />
                Best 3rd{completedGroups < 12 ? '*' : ''}
              </span>
            </div>
          </div>

          {completedGroups < 12 && (
            <p className="text-[10px] text-slate-600 mb-3 px-1">
              * Best-8 third-place projection based on {completedGroups}/12 groups complete
            </p>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[...groupStandings.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([group, teams]) => (
                <GroupTable
                  key={group}
                  group={group}
                  teams={teams}
                  advancingThird={advancingThird}
                />
              ))
            }
          </div>
        </section>
      )}

    </div>
  );
}
