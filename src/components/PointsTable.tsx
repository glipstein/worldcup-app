import { Fragment } from 'react';
import type { DrafterTotals } from '../lib/types';
import Flag from './Flag';

interface Props {
  drafters: DrafterTotals[];
  /** Optional label shown in a banner above the table (e.g. "SIMULATED") */
  label?: string;
  labelColor?: string;
}

const KO_COLS = [
  { key: 'roundOf32'    as const, label: 'R32' },
  { key: 'roundOf16'    as const, label: 'R16' },
  { key: 'quarterFinal' as const, label: 'QF'  },
  { key: 'semiFinal'    as const, label: 'SF'  },
  { key: 'final'        as const, label: 'F'   },
];

function Cell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-700 select-none">–</span>;
  if (value === 0)    return <span className="text-slate-500">0</span>;
  return <span className="text-white font-semibold">{value}</span>;
}

export default function PointsTable({ drafters, label, labelColor }: Props) {
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center gap-2 px-1 mb-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded border"
            style={{
              color: labelColor ?? '#a78bfa',
              borderColor: labelColor ?? '#7c3aed',
              background: `${labelColor ?? '#7c3aed'}22`,
            }}
          >
            {label}
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-slate-900">
        <table className="w-full text-sm min-w-[580px]">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="sticky left-0 bg-slate-900 text-left py-3 px-4 text-slate-400
                             font-semibold z-10 min-w-[150px]">
                Team
              </th>
              <th className="py-3 px-2 text-slate-500 font-semibold text-center w-10 text-xs">GG1</th>
              <th className="py-3 px-2 text-slate-500 font-semibold text-center w-10 text-xs">GG2</th>
              <th className="py-3 px-2 text-slate-500 font-semibold text-center w-10 text-xs">GG3</th>
              {KO_COLS.map(c => (
                <th key={c.key}
                    className="py-3 px-2 text-slate-400 font-semibold text-center w-10 text-xs">
                  {c.label}
                </th>
              ))}
              <th className="py-3 px-4 text-slate-300 font-bold text-center text-xs">Total</th>
            </tr>
          </thead>
          <tbody>
            {drafters.map(drafter => (
              <Fragment key={drafter.id}>
                {/* Drafter header */}
                <tr
                  className="border-t-2 border-slate-800"
                  style={{ borderLeftColor: drafter.color, borderLeftWidth: 3 }}
                >
                  <td
                    colSpan={10}
                    className="py-1.5 px-4 text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: drafter.color }}
                  >
                    {drafter.name} — {drafter.total} pts
                  </td>
                </tr>

                {/* Team rows */}
                {drafter.teams.map(team => (
                  <tr
                    key={team.espnAbbr}
                    className="border-t border-slate-800/40 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="sticky left-0 bg-slate-900 py-2 px-4 z-10">
                      <span className={`flex items-center gap-2 ${team.eliminated ? 'opacity-40' : ''}`}>
                        <Flag espnAbbr={team.espnAbbr} size="sm" />
                        <span className={`font-medium text-sm ${
                          team.eliminated ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}>
                          {team.name}
                        </span>
                      </span>
                    </td>
                    {team.groupGames.map((v, i) => (
                      <td key={i} className="py-2 px-2 text-center text-xs">
                        <Cell value={v} />
                      </td>
                    ))}
                    {KO_COLS.map(c => (
                      <td key={c.key} className="py-2 px-2 text-center text-xs">
                        <Cell value={team[c.key]} />
                      </td>
                    ))}
                    <td className="py-2 px-4 text-center text-sm font-bold"
                        style={{ color: drafter.color }}>
                      {team.total}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
