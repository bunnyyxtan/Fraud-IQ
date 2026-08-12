import { useState, useCallback, useEffect, useRef } from 'react';
import { createSession, createDailySession, dailyDateKey, saveDailyRecord, Country, loadCountry, saveCountry, GameMode, GameSummary, resolveRound, RoundResult, summarize, recordGame, loadStats, loadSeen, markSeen, Choice, Stats, LIVES, PlayerProfile, loadProfile, saveProfile, clearProfile, levelFromXp, loadIntelCollected } from '@/lib/game';
import { fetchMe, ApiError } from '@/lib/api';
import { GameCard, CARD_IMAGE_URLS } from '@/data/cards';
import { pickIntel, INTEL_STATS, IntelStat } from '@/data/intel';
import { StartScreen } from '@/components/game/StartScreen';
import { PlayScreen } from '@/components/game/PlayScreen';
import { IntelCard } from '@/components/game/IntelCard';
import { ResultsScreen } from '@/components/game/ResultsScreen';
import { LeaderboardScreen } from '@/components/game/LeaderboardScreen';
import { ProfileScreen } from '@/components/game/ProfileScreen';
import { BottomNav } from '@/components/game/BottomNav';
import { GameBackdrop, type BackdropPhase } from '@/components/game/GameBackdrop';
import { BODY, PAPER, INK } from '@/lib/ui';

type GameState =
  | { stage: 'start' }
  | { stage: 'leaderboard' }
  | { stage: 'profile' }
  | { stage: 'playing'; mode: GameMode; session: GameCard[]; currentIndex: number; lives: number; streak: number; results: RoundResult[]; dailyDate: string | null }
  | { stage: 'feedback'; mode: GameMode; session: GameCard[]; currentIndex: number; lives: number; streak: number; results: RoundResult[]; lastResult: RoundResult; dailyDate: string | null; finalSummary: GameSummary | null }
  /* between-cases checkpoint: one verified real-world fraud stat, region-matched */
  | { stage: 'intel'; mode: GameMode; session: GameCard[]; nextIndex: number; lives: number; streak: number; results: RoundResult[]; dailyDate: string | null; intel: IntelStat }
  | { stage: 'results'; summary: GameSummary; mode: GameMode; dailyDate: string | null };

/**
 * 0-based indices of the just-answered card after which a scam intel
 * checkpoint appears (after Case 4 and Case 8). Two per run keeps the pace;
 * the stat is matched to the card the player just faced.
 */
const INTEL_AFTER = new Set([3, 7]);

export default function Home() {
  const [state, setState] = useState<GameState>({ stage: 'start' });
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [profile, setProfile] = useState<PlayerProfile | null>(() => loadProfile());
  const [country, setCountry] = useState<Country>(() => loadCountry());
  /** server-known level: floors the adaptive deck on signed-in devices where
      local stats are missing (fresh browser, old install) */
  const [serverLevel, setServerLevel] = useState(1);
  /** intel stats already shown this run; reset when a new run starts */
  const usedIntelRef = useRef<Set<string>>(new Set());

  /** Best-known player level: local XP mirror or the server floor, whichever
      is higher. Drives the adaptive deck and the start-screen deck label. */
  const playerLevel = Math.max(levelFromXp(stats.totalXp), serverLevel);

  const handleCountryChange = useCallback((next: Country) => {
    setCountry(next);
    saveCountry(next);
  }, []);

  const handleProfileChange = useCallback((newProfile: PlayerProfile | null) => {
    setProfile(newProfile);
    if (newProfile) saveProfile(newProfile);
    else clearProfile();
  }, []);

  const handleSessionExpired = useCallback(() => {
    clearProfile();
    setProfile(null);
  }, []);

  // Validate the stored profile once on load; a 401 means the server no longer
  // knows this device (e.g. data reset), so silently sign out instead of letting
  // every later save fail. Network hiccups are ignored on purpose.
  useEffect(() => {
    const stored = loadProfile();
    if (!stored) return;
    let cancelled = false;
    fetchMe(stored)
      .then((me) => {
        if (!cancelled) setServerLevel((prev) => Math.max(prev, me.level));
      })
      .catch((e) => {
        if (!cancelled && e instanceof ApiError && e.status === 401) {
          clearProfile();
          setProfile(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startGame = useCallback(() => {
    // Unseen cards first, so repeat runs keep surfacing fresh scenarios.
    // The deck's tier mix scales with the player's level (adaptive difficulty).
    const session = createSession(Math.random, loadSeen(), country, playerLevel);
    usedIntelRef.current = new Set();
    setState({
      stage: 'playing',
      mode: 'classic',
      session,
      currentIndex: 0,
      lives: LIVES,
      streak: 0,
      results: [],
      dailyDate: null
    });
  }, [country, playerLevel]);

  const startDaily = useCallback(() => {
    // Date-seeded: the whole world gets this exact deck today. The date is
    // captured ONCE here and pinned to the run, so a run that straddles ET
    // midnight stays a run of the day it started instead of leaking into
    // (and burning) the next day's gauntlet.
    const date = dailyDateKey();
    const session = createDailySession(date);
    usedIntelRef.current = new Set();
    setState({
      stage: 'playing',
      mode: 'daily',
      session,
      currentIndex: 0,
      lives: LIVES,
      streak: 0,
      results: [],
      dailyDate: date
    });
  }, []);

  const handleChoice = useCallback((choice: Choice, remainingMs: number) => {
    setState(current => {
      if (current.stage !== 'playing') return current;
      
      const card = current.session[current.currentIndex];
      const result = resolveRound(card, choice, remainingMs, current.streak);
      const isCorrect = result.correct;
      const newLives = isCorrect ? current.lives : current.lives - 1;
      const results = [...current.results, result];

      // Finalize the moment the outcome is decided, not when the player
      // clicks through to results. Once the last answer lands, a quit or a
      // page refresh can no longer un-burn a daily attempt or drop the run
      // from lifetime stats.
      const isTerminal = newLives <= 0 || current.currentIndex >= current.session.length - 1;
      let finalSummary: GameSummary | null = null;
      if (isTerminal) {
        finalSummary = summarize(results, newLives);
        const newStats = recordGame(finalSummary);
        setStats(newStats);
        if (current.mode === 'daily') {
          saveDailyRecord({
            date: current.dailyDate ?? dailyDateKey(),
            score: finalSummary.score,
            correct: finalSummary.correct,
            answered: finalSummary.answered,
            bestStreak: finalSummary.bestStreak,
            moneySaved: finalSummary.moneySaved,
            runId: finalSummary.runId,
            // keep the per case outcomes with the record so the shareable grid
            // survives a refresh, not just the live results screen
            marks: results.map((r) => r.correct)
          });
        }
      }

      return {
        stage: 'feedback',
        mode: current.mode,
        session: current.session,
        currentIndex: current.currentIndex,
        lives: newLives,
        streak: result.streak,
        results,
        lastResult: result,
        dailyDate: current.dailyDate,
        finalSummary
      };
    });
  }, []);

  const quitGame = useCallback(() => {
    // Mid-run bail from the quit dialog: back to the menu, nothing recorded.
    // Once the run is decided (finalSummary set) quitting is off the table;
    // the run is already on the books.
    setState(current =>
      current.stage === 'playing' || (current.stage === 'feedback' && !current.finalSummary)
        ? { stage: 'start' }
        : current,
    );
  }, []);

  const nextCard = useCallback(() => {
    setState(current => {
      if (current.stage !== 'feedback') return current;

      // Terminal runs were already recorded in handleChoice; just show them.
      if (current.finalSummary) {
        return { stage: 'results', summary: current.finalSummary, mode: current.mode, dailyDate: current.dailyDate };
      }

      // Checkpoint beat: after select cases, surface one verified fraud stat
      // matched to the card just faced and the player's region.
      if (INTEL_AFTER.has(current.currentIndex)) {
        const justPlayed = current.session[current.currentIndex];
        // Prefer files never archived on this device, so back-to-back runs
        // keep dealing NEW intel instead of repeating the same fact.
        const intel = pickIntel(justPlayed, country, usedIntelRef.current, loadIntelCollected());
        if (intel) {
          usedIntelRef.current.add(intel.id);
          return {
            stage: 'intel',
            mode: current.mode,
            session: current.session,
            nextIndex: current.currentIndex + 1,
            lives: current.lives,
            streak: current.streak,
            results: current.results,
            dailyDate: current.dailyDate,
            intel
          };
        }
      }

      return {
        stage: 'playing',
        mode: current.mode,
        session: current.session,
        currentIndex: current.currentIndex + 1,
        lives: current.lives,
        streak: current.streak,
        results: current.results,
        dailyDate: current.dailyDate
      };
    });
  }, [country]);

  const resumeAfterIntel = useCallback(() => {
    setState(current => {
      if (current.stage !== 'intel') return current;
      return {
        stage: 'playing',
        mode: current.mode,
        session: current.session,
        currentIndex: current.nextIndex,
        lives: current.lives,
        streak: current.streak,
        results: current.results,
        dailyDate: current.dailyDate
      };
    });
  }, []);

  // Warm every card photo once at mount so an ad card never paints a blank
  // image slot mid-run, even on a slow connection.
  useEffect(() => {
    for (const url of CARD_IMAGE_URLS) {
      const img = new Image();
      img.src = url;
    }
  }, []);

  // Mark cards seen as they are actually dealt, not upfront at session start.
  // A quit run therefore only burns the cards the player really looked at,
  // keeping unseen-first rotation honest.
  const currentCard =
    state.stage === 'playing' || state.stage === 'feedback'
      ? state.session[state.currentIndex]
      : null;
  useEffect(() => {
    if (currentCard) markSeen([currentCard]);
  }, [currentCard]);

  const backdropPhase: BackdropPhase =
    state.stage === 'playing' || state.stage === 'feedback' || state.stage === 'intel'
      ? 'play'
      : state.stage === 'results'
        ? 'results'
        : state.stage === 'leaderboard' || state.stage === 'profile'
          ? 'leaderboard'
          : 'start';

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col overflow-hidden"
      style={{ ...BODY, backgroundColor: PAPER, color: INK }}
    >
      <GameBackdrop phase={backdropPhase} />
      {state.stage === 'start' && (
        <StartScreen 
          stats={stats} 
          profile={profile}
          country={country}
          playerLevel={playerLevel}
          onCountryChange={handleCountryChange}
          onStart={startGame} 
          onStartDaily={startDaily}
          onProfileChange={handleProfileChange}
        />
      )}
      {state.stage === 'leaderboard' && (
        <LeaderboardScreen 
          profile={profile}
        />
      )}
      {state.stage === 'profile' && (
        <ProfileScreen
          stats={stats}
          profile={profile}
          country={country}
          onProfileChange={handleProfileChange}
          onPlay={startGame}
        />
      )}
      {state.stage === 'playing' && (
        <PlayScreen 
          card={state.session[state.currentIndex]} 
          lives={state.lives}
          streak={state.streak}
          score={state.results.reduce((total, r) => total + r.points, 0)}
          totalCards={state.session.length}
          currentIndex={state.currentIndex}
          mode={state.mode}
          country={country}
          onChoice={handleChoice} 
          onQuit={quitGame}
        />
      )}
      {state.stage === 'feedback' && (
        <PlayScreen 
          card={state.session[state.currentIndex]} 
          lives={state.lives}
          streak={state.streak}
          score={state.results.reduce((total, r) => total + r.points, 0)}
          totalCards={state.session.length}
          currentIndex={state.currentIndex}
          mode={state.mode}
          country={country}
          onChoice={handleChoice}
          onQuit={quitGame}
          feedbackResult={state.lastResult}
          onNext={nextCard}
        />
      )}
      {state.stage === 'intel' && (
        <IntelCard
          intel={state.intel}
          casesDone={state.nextIndex}
          onContinue={resumeAfterIntel}
        />
      )}
      {state.stage === 'results' && (
        <ResultsScreen 
          summary={state.summary} 
          runIntel={[...usedIntelRef.current]
            .map((id) => INTEL_STATS.find((s) => s.id === id))
            .filter((s): s is IntelStat => Boolean(s))}
          mode={state.mode}
          country={country}
          dailyDate={state.dailyDate}
          profile={profile}
          onReplay={startGame}
          onHome={() => setState({ stage: 'start' })}
          onViewLeaderboard={() => setState({ stage: 'leaderboard' })}
          onSessionExpired={handleSessionExpired}
          onProfileChange={handleProfileChange}
        />
      )}
      {(state.stage === 'start' || state.stage === 'leaderboard' || state.stage === 'profile') && (
        <BottomNav
          active={state.stage === 'start' ? 'play' : state.stage}
          onNavigate={(tab) => setState({ stage: tab === 'play' ? 'start' : tab })}
        />
      )}
    </div>
  );
}
