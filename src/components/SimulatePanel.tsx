import { useState } from 'react';
import type { Match, SimResult } from '../lib/types';
import { runSingleSim, runMonteCarlo } from '../lib/simulation';
import type { DrafterConfig } from '../config/draft';
import { DRAFT_CONFIG, DRAFTER_BY_ABBR } from '../config/draft';
import PointsTable from './PointsTable';

interface Props {
  matches: Match[];
  /** Override draft roster and abbr map (e.g. for Euro debug mode) */
  config?: DrafterConfig[];
  byAbbr?: Map<string, string>;
}

export default function SimulatePanel({ matches, config, byAbbr }: Props) {
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  const activeCfg = config ?? DRAFT_CONFIG;
  const activeByAbbr = byAbbr ?? DRAFTER_BY_ABBR;

  const unplayed = matches.filter(m => m.status !== 'finished').length;

  function handleSingle() {
    setRunning(true);
    setTimeout(() => {
      setResult({ mode: 'single', drafterTotals: runSingleSim(matches, activeCfg) });
      setRunning(false);
    }, 0);
  }

  function handleMonteCarlo() {
    setRunning(true);
    setTimeout(() => {
      setResult({
        mode: 'montecarlo',
        winProbabilities: runMonteCarlo(matches, 50_000, activeCfg, activeByAbbr),
      });
      setRunning(false);
    }, 0);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-slate-900 rounded-xl p-4">
        <h2 className="text-lg font-bold text-white mb-1">Simulate</h2>
        <p className="text-sm text-slate-400 mb-4">
          {unplayed} match{unplayed !== 1 ? 'es' : ''} remaining · strengths from pre-tournament betting odds
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSingle}
            disabled={running || unplayed === 0}
            className="px-4 py-2 rounded-lg font-semibold text-sm bg-sky-600 hover:bg-sky-500
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white"
          >
            {running && result?.mode !== 'montecarlo' ? 'Simulating…' : 'Simulate once'}
          </button>

          <button
            onClick={handleMonteCarlo}
            disabled={running || unplayed === 0}
            className="px-4 py-2 rounded-lg font-semibold text-sm bg-violet-600 hover:bg-violet-500
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white"
          >
            {running && result?.mode === 'montecarlo'
              ? 'Running 50 000 sims…'
              : 'Monte Carlo (50 000)'}
          </button>

          {result && (
            <button
              onClick={() => setResult(null)}
              className="px-4 py-2 rounded-lg font-semibold text-sm bg-slate-700
                         hover:bg-slate-600 transition-colors text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {unplayed === 0 && (
          <p className="text-xs text-slate-500 mt-3">
            Tournament is complete — nothing left to simulate.
          </p>
        )}
      </div>

      {/* Single sim → winner cards + full points table */}
      {result?.mode === 'single' && result.drafterTotals && (() => {
        const ranked = [...result.drafterTotals].sort((a, b) => b.total - a.total);
        const winner = ranked[0];
        const grandTotal = result.drafterTotals.reduce((s, d) => s + d.total, 0);
        return (
          <div className="space-y-4">
            {/* Winner banner */}
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: `${winner.color}18`, border: `1px solid ${winner.color}44` }}
            >
              <span className="text-2xl">🏆</span>
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Simulated winner
                </div>
                <div className="text-xl font-black" style={{ color: winner.color }}>
                  {winner.name}
                  <span className="text-sm font-normal text-slate-400 ml-2">
                    {winner.total} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Ranking cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ranked.map((d, i) => (
                <div
                  key={d.id}
                  className="bg-slate-900 rounded-xl p-3 flex flex-col gap-1"
                  style={{ borderTop: `3px solid ${d.color}` }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-xs font-semibold w-4">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <span className="text-white font-bold text-sm truncate">{d.name}</span>
                  </div>
                  <div className="text-xl font-black tabular-nums" style={{ color: d.color }}>
                    {d.total}
                    <span className="text-xs font-normal text-slate-500 ml-1">pts</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Full breakdown table */}
            <PointsTable
              drafters={result.drafterTotals}
              label="SIMULATED"
              labelColor="#a78bfa"
            />
            <p className="text-xs text-slate-600 px-1">
              One random outcome weighted by team strengths. Click again for a different draw.
              {' '}Total pts: <span className={grandTotal === 160 ? 'text-green-600' : 'text-red-400'}>{grandTotal}</span> (expected 160)
            </p>
          </div>
        );
      })()}

      {/* Monte Carlo → win probabilities */}
      {result?.mode === 'montecarlo' && result.winProbabilities && (
        <div className="bg-slate-900 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            Pool win probability — 50 000 simulations
          </h3>
          <div className="space-y-3">
            {activeCfg
              .slice()
              .sort(
                (a, b) =>
                  (result.winProbabilities![b.id] ?? 0) -
                  (result.winProbabilities![a.id] ?? 0)
              )
              .map(d => {
                const pct = ((result.winProbabilities![d.id] ?? 0) * 100).toFixed(1);
                return (
                  <div key={d.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-white">{d.name}</span>
                      <span className="font-black tabular-nums" style={{ color: d.color }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: d.color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          <p className="text-xs text-slate-600 mt-4">
            Bradley-Terry model · each sim plays remaining matches to completion
          </p>
        </div>
      )}
    </div>
  );
}
