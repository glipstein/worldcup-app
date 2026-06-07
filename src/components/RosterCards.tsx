import type { DrafterTotals } from '../lib/types';

interface Props {
  drafters: DrafterTotals[];
}

export default function RosterCards({ drafters }: Props) {
  const sorted = [...drafters].sort((a, b) => b.total - a.total);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sorted.map(drafter => (
        <div
          key={drafter.id}
          className="bg-slate-900 rounded-xl overflow-hidden"
          style={{ boxShadow: `0 0 0 1px ${drafter.color}33` }}
        >
          {/* Card header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: `${drafter.color}22`, borderBottom: `2px solid ${drafter.color}` }}
          >
            <span className="font-bold text-lg text-white">{drafter.name}</span>
            <span className="font-black text-xl" style={{ color: drafter.color }}>
              {drafter.total}
              <span className="text-sm font-normal text-slate-400 ml-1">pts</span>
            </span>
          </div>

          {/* Team list */}
          <ul className="divide-y divide-slate-800">
            {drafter.teams.map(team => (
              <li
                key={team.espnAbbr}
                className={`flex items-center gap-3 px-4 py-2.5 transition-opacity ${
                  team.eliminated ? 'opacity-35' : ''
                }`}
              >
                <span className="text-xl leading-none">{team.flag}</span>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm font-medium ${
                      team.eliminated
                        ? 'line-through text-slate-500'
                        : 'text-slate-200'
                    }`}
                  >
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
                  <span className="text-xs text-slate-600 ml-1">out</span>
                )}
              </li>
            ))}
          </ul>

          {/* Placeholder for unpicked slots */}
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
