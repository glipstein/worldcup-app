import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllMatches } from './lib/espn';
import { calculateDrafterTotals } from './lib/scoring';
import MatchCards    from './components/MatchCards';
import Leaderboard   from './components/Leaderboard';
import PointsTable   from './components/PointsTable';
import RosterCards   from './components/RosterCards';
import WorldMap      from './components/WorldMap';
import SimulatePanel from './components/SimulatePanel';

type Tab = 'overview' | 'roster' | 'simulate';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'overview',  label: 'Overview',  emoji: '📊' },
  { id: 'roster',    label: 'Roster & Map', emoji: '👥' },
  { id: 'simulate',  label: 'Simulate',  emoji: '🎲' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');

  const { data: matches, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ['wc-matches'],
    queryFn: fetchAllMatches,
    refetchInterval: 5 * 60 * 1000,
    staleTime:       4 * 60 * 1000,
  });

  const drafters = matches ? calculateDrafterTotals(matches) : [];
  const updatedAt = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Header ── */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-black tracking-tight">
            ⚽ WC 2026 <span className="text-slate-400 font-normal text-sm">Pool</span>
          </h1>
          <div className="text-xs text-slate-500 text-right">
            {isLoading && <span className="animate-pulse text-slate-400">Loading…</span>}
            {isError   && <span className="text-red-400">API error — retrying</span>}
            {updatedAt && !isLoading && <span>Updated {updatedAt}</span>}
          </div>
        </div>

        {/* Tab bar */}
        <nav className="max-w-5xl mx-auto px-2 flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2
                          transition-colors whitespace-nowrap
                          ${tab === t.id
                            ? 'border-sky-400 text-sky-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <span className="mr-1">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Loading spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Fetching match data…</p>
          </div>
        )}

        {/* API error */}
        {isError && !matches && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-400 font-semibold">Failed to load match data</p>
            <p className="text-slate-400 text-sm mt-1">
              ESPN API may be unavailable. Will retry automatically.
            </p>
          </div>
        )}

        {/* ── Overview tab ── */}
        {!isLoading && tab === 'overview' && (
          <>
            {/* Match cards strip */}
            {matches && matches.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                  Matches
                </h2>
                <MatchCards matches={matches} />
              </section>
            )}

            {/* Leaderboard */}
            {drafters.length > 0 && (
              <section>
                <Leaderboard drafters={drafters} />
              </section>
            )}

            {/* Full points table */}
            {drafters.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                  Points breakdown
                </h2>
                <PointsTable drafters={drafters} />
              </section>
            )}
          </>
        )}

        {/* ── Roster & Map tab ── */}
        {!isLoading && tab === 'roster' && drafters.length > 0 && (
          <>
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                Rosters
              </h2>
              <RosterCards drafters={drafters} />
            </section>

            <section>
              <WorldMap />
            </section>
          </>
        )}

        {/* ── Simulate tab ── */}
        {!isLoading && tab === 'simulate' && matches && (
          <SimulatePanel matches={matches} />
        )}

      </main>
    </div>
  );
}
