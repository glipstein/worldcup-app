import {
  BarChart, Bar, XAxis, YAxis, Cell,
  Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import type { DrafterTotals } from '../lib/types';

interface Props {
  drafters: DrafterTotals[];
}

export default function Leaderboard({ drafters }: Props) {
  const sorted = [...drafters].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="bg-slate-900 rounded-xl p-4">
        <h2 className="text-lg font-bold text-white mb-4">Leaderboard</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 0, right: 48, left: 16, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals
            />
            <YAxis
              type="category"
              dataKey="name"
              width={72}
              tick={{ fill: '#e2e8f0', fontSize: 14, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
              itemStyle={{ color: '#94a3b8' }}
              formatter={(v: number) => [`${v} pts`, '']}
            />
            <Bar dataKey="total" radius={[0, 6, 6, 0]}>
              {sorted.map(d => (
                <Cell key={d.id} fill={d.color} />
              ))}
              <LabelList
                dataKey="total"
                position="right"
                style={{ fill: '#e2e8f0', fontSize: 13, fontWeight: 700 }}
                formatter={(v: number) => `${v}`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary rows */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {sorted.map((d, i) => (
          <div
            key={d.id}
            className="bg-slate-900 rounded-xl p-4 flex flex-col gap-1"
            style={{ borderTop: `3px solid ${d.color}` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-semibold">#{i + 1}</span>
              <span className="text-white font-bold truncate">{d.name}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: d.color }}>
              {d.total}
              <span className="text-sm font-normal text-slate-400 ml-1">pts</span>
            </div>
            <div className="text-xs text-slate-500">{d.teams.length} teams</div>
          </div>
        ))}
      </div>
    </div>
  );
}
