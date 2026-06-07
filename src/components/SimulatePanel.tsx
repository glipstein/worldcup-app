import { useState } from 'react';
import type { Match, SimResult } from '../lib/types';
import { runSingleSim, runMonteCarlo } from '../lib/simulation';
import { DRAFT_CONFIG } from '../config/draft';

interface Props {
  matches: Match[];
}

export default function SimulatePanel({ matches }: Props) {
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  const unplayed = matches.filter(m => m.status !== 'finished').length;
  const total    = matches.length;

  function handleSingle() {
    setRunning(true);
    setTimeout(() => {
      setResult({ mode: 'single', drafterPoints: runSingleSim(matches) });
      setRunning(false);
    }, 0); // yield to allow re-render before blocking
  }

  function handleMonteCarlo() {
    setRunning(true);
    setTimeout(() => {
      setResult({ mode: 'montecarlo', winProbabilities: runMonteCarlo(matches) });
      setRunning(false);
    }, 0);
  }

  function handleClear() {
    setResult(null);
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-xl p-4">
        <h2 className="text-lg font-bold text-white mb-1">Simulate</h2>
        <p className="text-sm text-slate-400 mb-4">
          {unplayed} of {total} matches remaining · team strengths derived from
          pre-tournament betting odds
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
            {running && result?.mode === 'montecarlo' ? 'Running 50 000 sims…' : 'Monte Carlo (50 000)'}
          </button>

          {result && (
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-lg font-semibold text-sm bg-slate-700 hover:bg-slate-600
                         transition-colors text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {unplayed === 0 && (
          <p className="text-xs text-slate-500 mt-3">
            All matches are finished — nothing left to simulate.
          </p>
        )}
      </div>

      {/* Single sim results */}
      {result?.mode === 'single' && result.drafterPoints && (
        <div className="bg-slate-900 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
            Simulated final standings
          </h3>
          <div className="space-y-2">
            {result.drafterPoints.map((d, i) => (
              <div
                key={d.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: `${d.color}15` }}
              >
                <span className="text-slate-500 text-sm w-4 font-mono">#{i + 1}</span>
                <span className="font-bold text-white flex-1">{d.name}</span>
                <span className="text-xl font-black tabular-nums" style={{ color: d.color }}>
                  {d.total}
                  <span className="text-sm font-normal text-slate-400 ml-1">pts</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">
            One random outcome weighted by team strengths. Run again for a different result.
          </p>
        </div>
      )}

      {/* Monte Carlo results */}
      {result?.mode === 'montecarlo' && result.winProbabilities && (
        <div className="bg-slate-900 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
            Pool win probability — 50 000 simulations
          </h3>
          <div className="space-y-3">
            {DRAFT_CONFIG
              .slice()
              .sort((a, b) =>
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
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: d.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          <p className="text-xs text-slate-600 mt-3">
            Each simulation plays out the remaining matches using a Bradley-Terry
            strength model seeded from pre-tournament betting odds.
          </p>
        </div>
      )}
    </div>
  );
}
