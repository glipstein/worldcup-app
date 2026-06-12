import { Fragment, useState } from 'react';
import type { DrafterTotals } from '../lib/types';
import { DRAFT_CONFIG } from '../config/draft';
import Flag from './Flag';

// Pick numbers derived from snake draft order.
// DRAFT_CONFIG order = draft order (Pedersen 1st, Barber 2nd, …).
const PICK_MAP: Map<string, number> = (() => {
  const N = DRAFT_CONFIG.length; // 4 drafters
  const map = new Map<string, number>();
  DRAFT_CONFIG.forEach((drafter, di) => {
    drafter.teams.forEach((team, round) => {
      const pick = round * N + (round % 2 === 0 ? di : N - 1 - di) + 1;
      map.set(team.espnAbbr, pick);
    });
  });
  return map;
})();

interface Props {
  drafters: DrafterTotals[];
}

export default function RosterCards({ drafters }: Props) {
  const [view, setView] = useState<'group' | 'draft'>('group');

  return (
    <div className="space-y-3">
      {/* View toggle */}
      <div className="flex gap-1 bg-slate-800 rounded-lg p-1 w-fit">
        {(['group', 'draft'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize
                        ${view === v
                          ? 'bg-slate-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'}`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'group' ? (
        <GroupView drafters={drafters} />
      ) : (
        <DraftView drafters={drafters} />
      )}
    </div>
  );
}

// ── Group view ────────────────────────────────────────────────────────────────

function GroupView({ drafters }: { drafters: DrafterTotals[] }) {
  const sorted = [...drafters].sort((a, b) => b.total - a.total);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sorted.map(drafter => (
        <div
          key={drafter.id}
          className="bg-slate-900 rounded-xl overflow-hidden"
          style={{ boxShadow: `0 0 0 1px ${drafter.color}33` }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: `${drafter.color}1a`, borderBottom: `2px solid ${drafter.color}` }}
          >
            <span className="font-bold text-lg text-white">{drafter.name}</span>
            <span className="font-black text-xl tabular-nums" style={{ color: drafter.color }}>
              {drafter.total}
              <span className="text-sm font-normal text-slate-400 ml-1">pts</span>
            </span>
          </div>

          <ul className="divide-y divide-slate-800/60">
            {drafter.teams.map(team => (
              <li
                key={team.espnAbbr}
                className={`flex items-center gap-2.5 px-4 py-2.5 transition-opacity
                            ${team.eliminated ? 'opacity-30' : ''}`}
              >
                <span className="text-xs text-slate-500 tabular-nums w-5 shrink-0 text-right">
                  {PICK_MAP.get(team.espnAbbr)}
                </span>
                <Flag espnAbbr={team.espnAbbr} size="md" />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${
                    team.eliminated ? 'line-through text-slate-500' : 'text-slate-200'
                  }`}>
                    {team.name}
                  </span>
                </div>
                <span
                  className="text-sm font-bold tabular-nums shrink-0"
                  style={{ color: team.eliminated ? '#475569' : drafter.color }}
                >
                  {team.total} pts
                </span>
                {team.eliminated && (
                  <span className="text-[10px] text-slate-600 font-semibold">OUT</span>
                )}
              </li>
            ))}
          </ul>

          {drafter.teams.length < 12 && (
            <div className="px-4 py-2 text-xs text-slate-600 italic border-t border-slate-800">
              +{12 - drafter.teams.length} pick{12 - drafter.teams.length !== 1 ? 's' : ''} remaining
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Draft view ────────────────────────────────────────────────────────────────

function DraftView({ drafters }: { drafters: DrafterTotals[] }) {
  const N = DRAFT_CONFIG.length; // picks per round

  const allPicks = drafters
    .flatMap(drafter => drafter.teams.map(team => ({ team, drafter })))
    .sort((a, b) => (PICK_MAP.get(a.team.espnAbbr) ?? 99) - (PICK_MAP.get(b.team.espnAbbr) ?? 99));

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden">
      <ul className="divide-y divide-slate-800/60">
        {allPicks.map(({ team, drafter }, idx) => {
          const pick  = PICK_MAP.get(team.espnAbbr) ?? 0;
          const round = Math.ceil(pick / N);
          const prevPick = idx > 0 ? (PICK_MAP.get(allPicks[idx - 1].team.espnAbbr) ?? 0) : 0;
          const prevRound = Math.ceil(prevPick / N);

          return (
            <Fragment key={team.espnAbbr}>
              {round !== prevRound && (
                <li className="px-4 py-1.5 bg-slate-800/50 border-b border-slate-700/50">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                    Round {round}
                  </span>
                </li>
              )}
              <li
                className={`flex items-center gap-2.5 pl-3 pr-4 py-2.5 transition-opacity
                            ${team.eliminated ? 'opacity-30' : ''}`}
                style={{ borderLeft: `3px solid ${drafter.color}` }}
              >
                <span className="text-xs text-slate-500 tabular-nums w-5 shrink-0 text-right">
                  {pick}
                </span>
                <Flag espnAbbr={team.espnAbbr} size="md" />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${
                    team.eliminated ? 'line-through text-slate-500' : 'text-slate-200'
                  }`}>
                    {team.name}
                  </span>
                  <span className="text-xs ml-2" style={{ color: drafter.color }}>
                    {drafter.name}
                  </span>
                </div>
                <span
                  className="text-sm font-bold tabular-nums shrink-0"
                  style={{ color: team.eliminated ? '#475569' : drafter.color }}
                >
                  {team.total} pts
                </span>
                {team.eliminated && (
                  <span className="text-[10px] text-slate-600 font-semibold">OUT</span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}
