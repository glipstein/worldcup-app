import { useRef, useMemo, useEffect } from 'react';
import type { Match } from '../lib/types';
import { DRAFTER_BY_ABBR, DRAFTER_BY_ID } from '../config/draft';
import Flag from './Flag';

interface Props {
  matches: Match[];
}

// ─── Single match card ────────────────────────────────────────────────────────

function MatchCard({ match }: { match: Match }) {
  const homeDrafter = DRAFTER_BY_ID.get(DRAFTER_BY_ABBR.get(match.homeAbbr) ?? '');
  const awayDrafter = DRAFTER_BY_ID.get(DRAFTER_BY_ABBR.get(match.awayAbbr) ?? '');
  const hasDraftedTeam = !!(homeDrafter || awayDrafter);

  const timeStr = new Date(match.date).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className={`rounded-xl p-3 w-48 shrink-0 border transition-colors
        ${match.status === 'live'
          ? 'bg-slate-900 border-green-500/60'
          : hasDraftedTeam
          ? 'bg-slate-900 border-slate-700'
          : 'bg-slate-900/60 border-slate-800'
        }`}
    >
      {/* Status / group header */}
      <div className="flex items-center justify-between mb-2 min-h-[18px]">
        {match.status === 'live' && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        )}
        {match.status === 'finished' && (
          <span className="text-[10px] text-slate-500 font-medium">FT</span>
        )}
        {match.status === 'scheduled' && (
          <span className="text-[10px] text-slate-400">{timeStr}</span>
        )}
        {match.group && (
          <span className="text-[10px] text-slate-500 ml-auto">
            {match.group.replace('Group ', 'Grp ')}
          </span>
        )}
        {!match.group && match.stage !== 'GROUP' && (
          <span className="text-[10px] text-slate-500 ml-auto">
            {match.stage.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-1">
        {/* Home */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <Flag espnAbbr={match.homeAbbr} size="md" />
          <span className="text-[11px] text-slate-300 font-medium text-center leading-tight truncate w-full text-center">
            {match.homeAbbr}
          </span>
          {homeDrafter ? (
            <span
              className="text-[9px] font-bold truncate w-full text-center leading-tight"
              style={{ color: homeDrafter.color }}
            >
              {homeDrafter.name}
            </span>
          ) : (
            <span className="text-[9px] text-transparent select-none">·</span>
          )}
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center justify-center w-12 shrink-0">
          {match.status !== 'scheduled' &&
          match.homeScore !== null &&
          match.awayScore !== null ? (
            <span className="text-base font-black text-white tabular-nums leading-none">
              {match.homeScore}–{match.awayScore}
            </span>
          ) : (
            <span className="text-xs text-slate-600 font-semibold">vs</span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <Flag espnAbbr={match.awayAbbr} size="md" />
          <span className="text-[11px] text-slate-300 font-medium text-center leading-tight truncate w-full text-center">
            {match.awayAbbr}
          </span>
          {awayDrafter ? (
            <span
              className="text-[9px] font-bold truncate w-full text-center leading-tight"
              style={{ color: awayDrafter.color }}
            >
              {awayDrafter.name}
            </span>
          ) : (
            <span className="text-[9px] text-transparent select-none">·</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Scrollable strip ─────────────────────────────────────────────────────────

const STATUS_ORDER: Record<string, number> = { live: 0, finished: 1, scheduled: 2 };

export default function MatchCards({ matches }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group by UTC date, sort within each day by status
  const groups = useMemo(() => {
    const map: Record<string, Match[]> = {};
    for (const m of matches) {
      const day = m.date.slice(0, 10);
      (map[day] ??= []).push(m);
    }
    for (const day of Object.keys(map)) {
      map[day].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [matches]);

  // On mount, scroll to the first live or scheduled match (today's action)
  useEffect(() => {
    if (!scrollRef.current) return;
    const target = scrollRef.current.querySelector<HTMLElement>('[data-live],[data-scheduled]');
    if (target) {
      target.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' });
    }
  }, [groups]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 340 : -340, behavior: 'smooth' });
  };

  if (matches.length === 0) return null;

  return (
    <div className="relative group/strip">
      {/* Left arrow */}
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                   bg-slate-800/90 hover:bg-slate-700 text-white rounded-full
                   w-7 h-7 flex items-center justify-center shadow-lg
                   opacity-0 group-hover/strip:opacity-100 transition-opacity"
      >
        ‹
      </button>

      {/* Cards */}
      <div
        ref={scrollRef}
        className="overflow-x-auto flex gap-2 px-8 pb-1 scrollbar-hide"
      >
        {groups.map(([date, dayMatches]) => {
          const label = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          const firstLiveOrScheduled = dayMatches.findIndex(
            m => m.status === 'live' || m.status === 'scheduled'
          );
          return (
            <div key={date} className="flex gap-2 shrink-0">
              {/* Day label */}
              <div className="flex flex-col justify-start pt-1 shrink-0 w-8">
                <div className="text-[10px] text-slate-500 font-semibold text-center leading-tight">
                  {label.split(' ')[0]}
                </div>
                <div className="text-xs text-slate-300 font-bold text-center leading-tight">
                  {label.split(' ')[1]}
                </div>
                <div className="w-px bg-slate-700 mx-auto flex-1 mt-1" />
              </div>
              {/* That day's cards */}
              {dayMatches.map((m, i) => (
                <div
                  key={m.id}
                  data-live={m.status === 'live' ? true : undefined}
                  data-scheduled={
                    m.status === 'scheduled' && i === firstLiveOrScheduled
                      ? true
                      : undefined
                  }
                >
                  <MatchCard match={m} />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                   bg-slate-800/90 hover:bg-slate-700 text-white rounded-full
                   w-7 h-7 flex items-center justify-center shadow-lg
                   opacity-0 group-hover/strip:opacity-100 transition-opacity"
      >
        ›
      </button>
    </div>
  );
}
