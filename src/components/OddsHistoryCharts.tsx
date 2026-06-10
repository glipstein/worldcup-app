/**
 * Odds History Charts — tournament-long trend lines.
 *
 *  1. Pool win probability per drafter, over time.
 *  2. Tournament-winner probability for the top teams, over time.
 *
 * Data source: src/data/oddsHistory.json — one point per calendar day, written
 * by scripts/snapshot-odds.ts (runs in CI every 6h, upserts today's point with
 * the freshest Polymarket odds + ESPN results). The file is bundled at build
 * time, so each committed snapshot ships with the next Pages deploy.
 */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import oddsHistory from '../data/oddsHistory.json';
import { DRAFT_CONFIG } from '../config/draft';

interface DaySnapshot {
  date: string;
  drafters: Record<string, number>;
  teams: Record<string, number>;
}

const HISTORY = (oddsHistory.history ?? []) as DaySnapshot[];

// Number of teams to plot in the tournament-winner chart.
const TOP_TEAMS = 12;

// Distinct palette for team lines (drafter colors would collide — 4 colors,
// 12 teams). Ordered for good neighbor contrast.
const TEAM_PALETTE = [
  '#f43f5e', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#06b6d4',
  '#f97316', '#ec4899', '#84cc16', '#14b8a6', '#8b5cf6', '#ef4444',
  '#0ea5e9', '#10b981', '#f59e0b',
];

// abbr → { name, flag } from the draft config (covers all 48 drafted teams).
const TEAM_META: Record<string, { name: string; flag: string }> = {};
for (const d of DRAFT_CONFIG) {
  for (const t of d.teams) TEAM_META[t.espnAbbr] = { name: t.name, flag: t.flag };
}

function fmtDate(iso: string): string {
  // "2026-06-10" → "Jun 10"  (parse as UTC to avoid TZ drift)
  const [y, m, day] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, day));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const rows = [...payload].sort((a, b) => b.value - a.value);
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <div className="text-slate-400 font-semibold mb-1">{fmtDate(label)}</div>
      {rows.map((r: any) => (
        <div key={r.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
          <span className="text-slate-200">{r.name}</span>
          <span className="ml-auto font-mono text-slate-100">{r.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

export default function OddsHistoryCharts() {
  if (HISTORY.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
        <p className="text-slate-400 text-sm">No odds history yet.</p>
        <p className="text-slate-600 text-xs mt-1">
          The first data point is recorded the next time the snapshot job runs.
        </p>
      </div>
    );
  }

  // ── Drafter rows: [{ date, pederson: 31.4, barber: ... }] (as percentages) ──
  const drafterRows = HISTORY.map(h => {
    const row: Record<string, number | string> = { date: h.date };
    for (const d of DRAFT_CONFIG) row[d.id] = (h.drafters[d.id] ?? 0) * 100;
    return row;
  });

  // ── Pick the top teams by their latest-day probability ──────────────────────
  const latest = HISTORY[HISTORY.length - 1].teams;
  const topTeams = Object.entries(latest)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_TEAMS)
    .map(([abbr]) => abbr);

  const teamRows = HISTORY.map(h => {
    const row: Record<string, number | string> = { date: h.date };
    for (const abbr of topTeams) row[abbr] = (h.teams[abbr] ?? 0) * 100;
    return row;
  });

  const single = HISTORY.length === 1; // render visible dots when there's one point

  const axisProps = {
    stroke: '#64748b',
    tick: { fill: '#94a3b8', fontSize: 11 },
  };

  return (
    <div className="space-y-8">
      {/* ── Chart 1: drafter pool win probability ── */}
      <section>
        <h3 className="text-sm font-bold text-slate-200 mb-1">
          Pool win probability over time
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Each drafter's chance of winning the pool, from {HISTORY.length.toLocaleString()}-day
          {' '}history · {Number(oddsHistory.numSims).toLocaleString()} sims/day
        </p>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={drafterRows} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tickFormatter={fmtDate} {...axisProps} />
              <YAxis unit="%" domain={[0, 'auto']} {...axisProps} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {DRAFT_CONFIG.map(d => (
                <Line
                  key={d.id}
                  type="monotone"
                  dataKey={d.id}
                  name={d.name}
                  stroke={d.color}
                  strokeWidth={2.5}
                  dot={single ? { r: 4 } : false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Chart 2: team tournament-winner probability ── */}
      <section>
        <h3 className="text-sm font-bold text-slate-200 mb-1">
          Tournament winner probability over time
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Top {TOP_TEAMS} teams by current championship odds.
        </p>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={teamRows} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tickFormatter={fmtDate} {...axisProps} />
              <YAxis unit="%" domain={[0, 'auto']} {...axisProps} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {topTeams.map((abbr, i) => (
                <Line
                  key={abbr}
                  type="monotone"
                  dataKey={abbr}
                  name={`${TEAM_META[abbr]?.flag ?? ''} ${abbr}`}
                  stroke={TEAM_PALETTE[i % TEAM_PALETTE.length]}
                  strokeWidth={2}
                  dot={single ? { r: 3 } : false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
