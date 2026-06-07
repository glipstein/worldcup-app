import type { DrafterTotals } from '../lib/types';

interface Props {
  drafters: DrafterTotals[];
}

const COLS = [
  { key: 'groupGames.0', label: 'GG1' },
  { key: 'groupGames.1', label: 'GG2' },
  { key: 'groupGames.2', label: 'GG3' },
  { key: 'roundOf32',    label: 'R32' },
  { key: 'roundOf16',    label: 'R16' },
  { key: 'quarterFinal', label: 'QF'  },
  { key: 'semiFinal',    label: 'SF'  },
  { key: 'final',        label: 'F'   },
];

function CellVal({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-slate-600 select-none">–</span>;
  if (value === 0)
    return <span className="text-slate-500">0</span>;
  return <span className="text-white font-semibold">{value}</span>;
}

export default function PointsTable({ drafters }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl bg-slate-900">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="sticky left-0 bg-slate-900 text-left py-3 px-4 text-slate-400 font-semibold z-10 min-w-[140px]">
              Team
            </th>
            {COLS.map(c => (
              <th
                key={c.key}
                className="py-3 px-2 text-slate-400 font-semibold text-center w-12"
              >
                {c.label}
              </th>
            ))}
            <th className="py-3 px-4 text-slate-300 font-bold text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          {drafters.map(drafter => (
            <>
              {/* Drafter header row */}
              <tr
                key={`header-${drafter.id}`}
                className="border-t border-slate-800"
                style={{ borderLeftColor: drafter.color, borderLeftWidth: 3 }}
              >
                <td
                  colSpan={COLS.length + 2}
                  className="py-2 px-4 text-xs font-bold uppercase tracking-widest"
                  style={{ color: drafter.color }}
                >
                  {drafter.name} — {drafter.total} pts
                </td>
              </tr>

              {/* Team rows */}
              {drafter.teams.map(team => (
                <tr
                  key={team.espnAbbr}
                  className="border-t border-slate-800/50 hover:bg-slate-800/40 transition-colors"
                >
                  <td className="sticky left-0 bg-slate-900 py-2 px-4 z-10">
                    <span
                      className={`flex items-center gap-2 ${team.eliminated ? 'opacity-40' : ''}`}
                    >
                      <span>{team.flag}</span>
                      <span
                        className={`font-medium ${team.eliminated ? 'line-through text-slate-500' : 'text-slate-200'}`}
                      >
                        {team.name}
                      </span>
                    </span>
                  </td>
                  {/* GG1 GG2 GG3 */}
                  {team.groupGames.map((v, i) => (
                    <td key={i} className="py-2 px-2 text-center">
                      <CellVal value={v} />
                    </td>
                  ))}
                  {/* Knockout rounds */}
                  {(['roundOf32', 'roundOf16', 'quarterFinal', 'semiFinal', 'final'] as const).map(k => (
                    <td key={k} className="py-2 px-2 text-center">
                      <CellVal value={team[k]} />
                    </td>
                  ))}
                  <td className="py-2 px-4 text-center font-bold" style={{ color: drafter.color }}>
                    {team.total}
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
