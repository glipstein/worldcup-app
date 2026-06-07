import { useState } from 'react';
import type { Match, SimResult } from '../lib/types';
import { runSingleSim, runMonteCarlo } from '../lib/simulation';
import { DRAFT_CONFIG } from '../config/draft';
import PointsTable from './PointsTable';

interface Props {
  matches: Match[];
}

export default function SimulatePanel({ matches }: Props) {
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  const unplayed = matches.filter(m => m.status !== 'finished').length;

  function handleSingle() {
    setRunning(true);
    setTimeout(() => {
      setResult({ mode: 'single', drafterTotals: runSingleSim(matches) });
      setRunning(false);
    }, 0);
  }

  function handleMonteCarlo() {
    setRunning(true);
    setTimeout(() => {
      setResult({ mode: 'montecarlo', winProbabilities: runMonteCarlo(matches) });
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

      {/* Single sim → full points table */}
      {result?.mode === 'single' && result.drafterTotals && (
        <div className="space-y-2">
          <PointsTable
            drafters={result.drafterTotals}
            label="SIMULATED"
            labelColor="#a78bfa"
          />
          <p className="text-xs text-slate-600 px-1">
            One random outcome weighted by team strengths. Click again for a different draw.
          </p>
        </div>
      )}

      {/* Monte Carlo → win probabilities */}
      {result?.mode === 'montecarlo' && result.winProbabilities && (
        <div className="bg-slate-900 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            Pool win probability — 50 000 simulations
          </h3>
          <div className="space-y-3">
            {DRAFT_CONFIG
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
