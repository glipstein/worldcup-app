/**
 * Debug Page — UEFA Euro 2024 time-travel simulator
 *
 * Two purposes:
 *  1. Verify the ESPN API is accessible and returning real data.
 *  2. Preview the app at different stages of a completed tournament so you can
 *     validate that scoring, simulation, and UI all work correctly as games
 *     progress from scheduled → live → finished.
 *
 * Access via: ?debug (or /?debug=1) in the URL.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchEuroMatches, applyTimeCutoff, EURO_MILESTONES } from '../lib/euroEspn';
import { EURO_DRAFT_CONFIG, EURO_DRAFTER_BY_ABBR } from '../config/euroDraft';
import { calculateDrafterTotals } from '../lib/scoring';
import MatchCards    from './MatchCards';
import Leaderboard   from './Leaderboard';
import PointsTable   from './PointsTable';
import SimulatePanel from './SimulatePanel';
import OddsHistoryCharts from './OddsHistoryCharts';

type DebugTab = 'matches' | 'points' | 'simulate' | 'trends';

// ─── API health panel ─────────────────────────────────────────────────────────

function ApiStatus({
  isLoading,
  isError,
  matchCount,
  error,
}: {
  isLoading: boolean;
  isError: boolean;
  matchCount: number | null;
  error: Error | null;
}) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          ESPN API
        </span>

        {isLoading && (
          <span className="flex items-center gap-2 text-sm text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Fetching UEFA Euro 2024…
          </span>
        )}

        {isError && (
          <span className="flex items-center gap-2 text-sm text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            API error — endpoint may differ from WC 2026
          </span>
        )}

        {!isLoading && !isError && matchCount !== null && (
          <span className="flex items-center gap-2 text-sm text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {matchCount} matches loaded from&nbsp;
            <code className="text-[11px] text-slate-400">
              site.api.espn.com/…/uefa.euro/scoreboard
            </code>
          </span>
        )}
      </div>

      {isError && (
        <p className="text-xs text-slate-500 mt-2">
          Try checking the network tab in DevTools. The WC API works correctly
          (different league slug). This error only affects the debug Euro view.
        </p>
      )}

      {!isLoading && !isError && error === null && (
        <p className="text-xs text-slate-600 mt-1.5">
          WC 2026 API is confirmed working — this validates the ESPN parsing layer.
        </p>
      )}
    </div>
  );
}

// ─── Time-travel controls ─────────────────────────────────────────────────────

function MilestoneSelector({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
        ⏱ Time travel — show app as of…
      </div>
      <div className="flex flex-wrap gap-2">
        {EURO_MILESTONES.map((m, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${i === selected
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-600 mt-2.5">
        Matches before the cutoff show real results; matches after appear scheduled.
        Simulation uses the fictional Euro draft below.
      </p>
    </div>
  );
}

// ─── Euro roster summary ──────────────────────────────────────────────────────

function RosterSummary() {
  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-yellow-700/40">
      <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">
        Fictional Euro 2024 Draft Rosters
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {EURO_DRAFT_CONFIG.map(d => (
          <div key={d.id}>
            <div
              className="text-xs font-bold mb-1"
              style={{ color: d.color }}
            >
              {d.name}
            </div>
            <div className="space-y-0.5">
              {d.teams.map(t => (
                <div key={t.espnAbbr} className="text-[11px] text-slate-400">
                  {t.flag} {t.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-600 mt-3">
        Snake draft (ESP→ENG→FRA→GER, reverse, repeat). Purely for testing.
        Euro 2024 winner was Spain; England was runner-up.
      </p>
    </div>
  );
}

// ─── Main debug page ──────────────────────────────────────────────────────────

export default function DebugPage() {
  const [milestoneIdx, setMilestoneIdx] = useState(EURO_MILESTONES.length - 1); // default: Complete
  const [tab, setTab] = useState<DebugTab>('matches');

  const {
    data: rawMatches,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['euro-2024-matches'],
    queryFn: fetchEuroMatches,
    staleTime: Infinity, // historical data never changes
    retry: 2,
  });

  const milestone = EURO_MILESTONES[milestoneIdx];

  // Apply time cutoff — makes future matches appear scheduled
  const matches = useMemo(
    () => (rawMatches ? applyTimeCutoff(rawMatches, milestone.cutoff) : []),
    [rawMatches, milestone.cutoff]
  );

  // Score with Euro draft config
  const drafters = useMemo(
    () => calculateDrafterTotals(matches, EURO_DRAFT_CONFIG),
    [matches]
  );

  const finishedCount = matches.filter(m => m.status === 'finished').length;
  const scheduledCount = matches.filter(m => m.status === 'scheduled').length;

  const TABS: { id: DebugTab; label: string }[] = [
    { id: 'matches',  label: '📅 Matches' },
    { id: 'points',   label: '📊 Points' },
    { id: 'simulate', label: '🎲 Simulate' },
    { id: 'trends',   label: '📈 Trends' },
  ];

  return (
    <div className="space-y-5">
      {/* Debug banner */}
      <div className="bg-yellow-900/30 border border-yellow-700/60 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-black text-base">🔧</span>
          <span className="text-yellow-300 font-bold text-sm">Debug Mode — UEFA Euro 2024</span>
        </div>
        <p className="text-xs text-yellow-700 mt-0.5">
          Historical tournament data with fictional draft rosters. Not part of the
          live WC 2026 pool.
        </p>
      </div>

      {/* API health */}
      <ApiStatus
        isLoading={isLoading}
        isError={isError}
        matchCount={rawMatches?.length ?? null}
        error={error as Error | null}
      />

      {/* Time travel */}
      <MilestoneSelector selected={milestoneIdx} onSelect={setMilestoneIdx} />

      {/* Match counts at selected milestone */}
      {!isLoading && rawMatches && (
        <div className="flex gap-4 text-xs text-slate-500 px-1">
          <span>
            <span className="text-green-400 font-semibold">{finishedCount}</span> finished
          </span>
          <span>
            <span className="text-slate-400 font-semibold">{scheduledCount}</span> scheduled
          </span>
          <span>
            <span className="text-white font-semibold">{matches.length}</span> total
          </span>
        </div>
      )}

      {/* Roster summary */}
      <RosterSummary />

      {/* Leaderboard (always visible below roster) */}
      {drafters.length > 0 && (
        <section>
          <Leaderboard drafters={drafters} />
        </section>
      )}

      {/* Tab bar */}
      <div className="border-b border-slate-800 flex">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors
              ${tab === t.id
                ? 'border-violet-400 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center space-y-2">
          <p className="text-red-400 font-semibold">Could not load Euro 2024 data</p>
          <p className="text-slate-400 text-sm">
            The ESPN Euro endpoint may use a different URL than expected.
          </p>
          <p className="text-slate-500 text-xs">
            {(error as Error)?.message ?? 'Unknown error'}
          </p>
          <p className="text-slate-600 text-xs mt-1">
            Note: the WC 2026 API (<code>fifa.world</code>) is unaffected.
          </p>
        </div>
      )}

      {!isLoading && !isError && tab === 'matches' && matches.length > 0 && (
        <section>
          <MatchCards matches={matches} config={EURO_DRAFT_CONFIG} />
        </section>
      )}

      {!isLoading && !isError && tab === 'points' && drafters.length > 0 && (
        <section>
          <PointsTable drafters={drafters} />
        </section>
      )}

      {!isLoading && !isError && tab === 'simulate' && matches.length > 0 && (
        <SimulatePanel
          matches={matches}
          config={EURO_DRAFT_CONFIG}
          byAbbr={EURO_DRAFTER_BY_ABBR}
        />
      )}

      {/* Trends — live WC 2026 odds history (independent of the Euro data above) */}
      {tab === 'trends' && (
        <section className="space-y-2">
          <p className="text-xs text-slate-500">
            Live WC 2026 pool &amp; tournament odds, recorded once per day. Independent
            of the Euro 2024 time-travel data above.
          </p>
          <OddsHistoryCharts />
        </section>
      )}

      {!isLoading && !isError && matches.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-8">
          No matches loaded — check the API status above.
        </p>
      )}
    </div>
  );
}
