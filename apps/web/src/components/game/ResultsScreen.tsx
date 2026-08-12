import { useEffect, useMemo, useRef, useState } from 'react';
import { Country, GameMode, GameSummary, buildDailyShareText, dailyDateKey, formatMoney, PlayerProfile, levelProgress, LEVEL_TITLES, levelTagline, storageAvailable, loadGuestAvatar } from '@/lib/game';
import { CATEGORY_LABELS, type Category } from '@/data/cards';
import { nationalLossStat, type IntelStat } from '@/data/intel';
import { ApiError, createPlayer, submitScore, SubmitScoreResponse } from '@/lib/api';
import { sound } from '@/lib/sound';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { CountUp } from './CountUp';
import {
  BODY, DISPLAY, MONO,
  INK, INK_SOFT, INK_FAINT, INK_MICRO, HAIRLINE, HAIRLINE_STRONG, SURFACE, PAPER_ON_INK,
  SCAM, SCAM_SOFT, LEGIT, LEGIT_SOFT, GOLD, GOLD_TEXT, GOLD_SOFT,
  SHADOW_SM, SHADOW_MD,
  SERIF,
  BORDER_INK, PREMIUM_CARD_SM,
  SPRING_SNAP, EASE_OUT,
  Pressable,
} from '@/lib/ui';

const MedalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

/** Per category right/total, derived from real round results, for the Threat Detection breakdown. */
function useCategoryBreakdown(summary: GameSummary) {
  return useMemo(() => {
    const tally = new Map<Category, { right: number; total: number }>();
    for (const r of summary.results) {
      const cat = r.card.category;
      const t = tally.get(cat) ?? { right: 0, total: 0 };
      t.total += 1;
      if (r.correct) t.right += 1;
      tally.set(cat, t);
    }
    return Array.from(tally.entries())
      .map(([category, t]) => ({ category, ...t }))
      .sort((a, b) => b.total - a.total);
  }, [summary]);
}

export function ResultsScreen({ 
  summary, 
  mode,
  country,
  dailyDate,
  profile,
  onReplay,
  onHome,
  runIntel,
  onViewLeaderboard,
  onSessionExpired,
  onProfileChange
}: { 
  summary: GameSummary, 
  mode: GameMode,
  /** player's region; money totals render in local currency */
  country?: Country,
  dailyDate?: string | null,
  profile: PlayerProfile | null,
  onReplay: () => void,
  onHome: () => void,
  /** intel files surfaced during this run, for the recovered-files strip */
  runIntel: IntelStat[],
  onViewLeaderboard: () => void,
  onSessionExpired?: () => void,
  onProfileChange: (p: PlayerProfile) => void
}) {
  const prefersReducedMotion = useReducedMotion();
  
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error' | 'expired'>('idle');
  /** server-explained rejection (e.g. daily one-shot 409); empty = generic retry */
  const [submitErrorMsg, setSubmitErrorMsg] = useState('');
  const [submitData, setSubmitData] = useState<SubmitScoreResponse | null>(null);
  
  const [stage, setStage] = useState<'initial' | 'scoreDone' | 'xpDone'>('initial');
  
  const submitRef = useRef(false);
  const submittingRef = useRef(false);

  const [claimName, setClaimName] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);

  const breakdown = useCategoryBreakdown(summary);

  /* the national figure this run belongs to, for the economics beat below the money cards */
  const macro = useMemo(() => nationalLossStat(country ?? 'us'), [country]);
  const macroTail = macro.headline.charAt(0).toLowerCase() + macro.headline.slice(1);

  const handleShare = async () => {
    const text = buildDailyShareText({
      date: dailyDateKey(),
      score: summary.score,
      correct: summary.correct,
      answered: summary.answered,
      bestStreak: summary.bestStreak,
      moneySaved: summary.moneySaved,
      runId: summary.runId,
      /* the grid: one dot per case in the order they were played */
      marks: summary.results.map((r) => r.correct),
    }, country);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      /* clipboard blocked (e.g. iframe permissions): button stays as-is */
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = claimName.trim();
    if (trimmed.length < 2 || trimmed.length > 16) {
      setClaimError('Name must be 2-16 characters.');
      return;
    }
    setClaimError('');
    setClaiming(true);
    try {
      const res = await createPlayer(trimmed, loadGuestAvatar() ?? undefined);
      sound.play('correct');
      /* setting the profile flips this panel to progression mode and
         triggers the auto-submit effect below with this run's summary */
      onProfileChange({ id: res.id, name: res.name, token: res.token, avatar: res.avatar });
    } catch {
      setClaimError("That name won't fly. Try another.");
      setClaiming(false);
    }
  };

  const doSubmit = async () => {
    if (!profile || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitState('submitting');
    setSubmitErrorMsg('');
    try {
      const res = await submitScore(profile, summary, mode, dailyDate ?? undefined);
      setSubmitData(res);
      setSubmitState('success');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        /* stale device profile (e.g. server data reset): sign out and tell the player.
           Reset the one-shot guard so claiming a fresh name can submit this run. */
        submitRef.current = false;
        setSubmitState('expired');
        onSessionExpired?.();
      } else if (e instanceof ApiError && e.status === 409) {
        /* the server refused this run outright (daily one-shot or closed
           gauntlet); retrying can never succeed, so show the reason instead */
        setSubmitErrorMsg(e.message || 'This run was not accepted.');
        setSubmitState('error');
      } else {
        setSubmitState('error');
      }
    } finally {
      submittingRef.current = false;
    }
  };

  useEffect(() => {
    if (!profile || submitRef.current) return;
    submitRef.current = true;
    doSubmit();
  }, [profile, summary]);

  const oldXp = submitData ? Math.max(0, submitData.totalXp - summary.score) : 0;
  const newXp = submitData?.totalXp || 0;
  const progressStart = levelProgress(oldXp);
  const progressEnd = levelProgress(newXp);
  const crossesLevel = submitData?.leveledUp;

  const title = mode === 'daily'
    ? (summary.gameOver ? 'Gauntlet Over' : 'Daily Cleared')
    : (summary.gameOver ? 'Case Closed' : 'Run Complete');

  /* daily is one shot a day, so its replay starts a fresh classic run */
  const replayLabel = mode === 'daily' ? 'Play a classic run' : 'Play again';

  return (
    <div className="flex justify-center w-full flex-1 overflow-y-auto" style={{ color: INK }}>
      <main
        className="w-full max-w-[440px] relative flex flex-col px-6 pt-10 pb-10 gap-5"
        style={BODY}
      >
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="flex flex-col items-center gap-3"
        >
          <div
            className="px-4 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-[0.22em] flex items-center gap-2"
            style={{ ...MONO, backgroundColor: GOLD_SOFT, color: GOLD_TEXT, border: '1px solid rgba(201,138,27,0.30)' }}
          >
            <MedalIcon />
            <span>{title}</span>
          </div>

          <div className="flex items-baseline gap-2 mt-2 tabular-nums">
            <h1
              className="leading-none m-0 text-[76px]"
              style={{ ...DISPLAY, fontWeight: 800 }}
              aria-label={`Final score ${summary.score} points`}
            >
              <span aria-hidden="true">
                <CountUp
                  end={summary.score}
                  format={(v) => v.toString()}
                  onComplete={() => setStage(s => s === 'initial' ? 'scoreDone' : s)}
                />
              </span>
            </h1>
            <span className="text-[20px] font-semibold" style={{ color: INK_SOFT }} aria-hidden="true">pts</span>
          </div>

          <div className="flex flex-col items-center gap-2.5 mt-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] m-0" style={{ ...MONO, color: INK_MICRO }}>
              Final score
            </p>
            <AnimatePresence>
              {submitData?.isNewBest && stage !== 'initial' && (
                <motion.div
                  initial={{ scale: prefersReducedMotion ? 1 : 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={SPRING_SNAP}
                  className="px-3.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ backgroundColor: GOLD, color: SURFACE, boxShadow: SHADOW_SM }}
                >
                  New record
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-2 text-[12px] font-medium" style={{ color: INK_SOFT }}>
              <span>Your Fraud IQ:</span>
              <span
                className="px-3 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: SURFACE, color: INK, border: `1px solid ${HAIRLINE}` }}
              >
                {summary.radar.name}
              </span>
            </div>
            <div className="text-[13px] text-center" style={{ ...SERIF, color: INK_SOFT }}>
              {summary.radar.line}
            </div>
          </div>
        </motion.header>

        {/* Stats card */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: EASE_OUT }}
          className="rounded-[24px] p-6 pt-8 relative mt-4"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_MD }}
        >
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-[12px] font-semibold tracking-wide whitespace-nowrap flex items-center gap-2"
            style={{ backgroundColor: INK, color: PAPER_ON_INK, boxShadow: SHADOW_SM }}
          >
            <span style={{ color: GOLD }}><StarIcon /></span>
            Rank: {summary.radar.name}
            <span style={{ color: GOLD }}><StarIcon /></span>
          </div>

          <div className="flex justify-between items-center mt-2 pb-5" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ ...MONO, color: INK_MICRO }}>Accuracy</span>
              <span className="text-[28px] leading-none tabular-nums" style={{ ...DISPLAY, fontWeight: 700 }}>
                <CountUp end={summary.correct} format={(v) => v.toString()} delay={300} />
                {' '}<span className="text-[18px]" style={{ color: INK_MICRO }}>/ {summary.answered}</span>
              </span>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ ...MONO, color: INK_MICRO }}>Best streak</span>
              <span className="text-[28px] leading-none tabular-nums" style={{ ...DISPLAY, fontWeight: 700, color: GOLD }}>
                <CountUp end={summary.bestStreak} format={(v) => v.toString()} delay={400} />
                {' '}<span className="text-[18px]" style={{ color: INK_MICRO }}>streak</span>
              </span>
            </div>
          </div>

          {breakdown.length > 0 && (
            <div className="pt-5">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] block mb-4" style={{ ...MONO, color: INK_MICRO }}>Threat detection</span>
              <div className="flex flex-col gap-3.5">
                {breakdown.map(({ category, right, total }) => (
                  <div key={category} className="flex justify-between items-center gap-3">
                    <span className="font-semibold text-[14px]">{CATEGORY_LABELS[category]}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        {Array.from({ length: total }).map((_, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: i < right ? LEGIT : SCAM, opacity: i < right ? 1 : 0.55 }}
                          />
                        ))}
                      </div>
                      <span className="text-[13px] font-semibold w-8 text-right tabular-nums" style={{ color: INK_SOFT }}>{right}/{total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Money impact */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: EASE_OUT }}
          className="grid grid-cols-2 gap-3.5"
        >
          <div className="rounded-2xl p-5 flex flex-col gap-1.5" style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_SM }}>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em]" style={{ ...MONO, color: SCAM }}>Money lost</span>
            <span className="text-[22px] tabular-nums leading-none" style={{ ...DISPLAY, fontWeight: 700, color: SCAM }}>
              <CountUp end={summary.moneyLost} format={(v) => formatMoney(v, country)} delay={600} />
            </span>
            <span className="text-[12px] font-medium leading-snug mt-1" style={{ color: INK_SOFT }}>
              You trusted {summary.missedScams.length} scams.
            </span>
          </div>
          <div className="rounded-2xl p-5 flex flex-col gap-1.5" style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_SM }}>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em]" style={{ ...MONO, color: LEGIT }}>Money saved</span>
            <span className="text-[22px] tabular-nums leading-none" style={{ ...DISPLAY, fontWeight: 700, color: LEGIT }}>
              <CountUp end={summary.moneySaved} format={(v) => formatMoney(v, country)} delay={800} />
            </span>
            <span className="text-[12px] font-medium leading-snug mt-1" style={{ color: INK_SOFT }}>
              You caught {summary.caughtScams.length} scams.
            </span>
          </div>
        </motion.div>

        {/* The economics beat: a scam has two prices, and this run sits inside a national number */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: EASE_OUT }}
          className="rounded-[24px] p-5"
          style={{ backgroundColor: SURFACE, border: BORDER_INK }}
        >
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] mb-4" style={{ ...MONO, color: INK_MICRO }}>
            The price of being wrong
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ ...MONO, color: SCAM }}>
                Too trusting
              </span>
              <span className="text-[20px] leading-none tabular-nums" style={{ ...DISPLAY, fontWeight: 700 }}>
                {formatMoney(summary.moneyLost, country)}
              </span>
              <span className="text-[12px] font-medium leading-snug" style={{ color: INK_SOFT }}>
                {summary.missedScams.length === 1 ? '1 scam walked in' : `${summary.missedScams.length} scams walked in`}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 pl-4" style={{ borderLeft: `1px solid ${HAIRLINE}` }}>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ ...MONO, color: GOLD_TEXT }}>
                Too suspicious
              </span>
              <span className="text-[20px] leading-none tabular-nums" style={{ ...DISPLAY, fontWeight: 700 }}>
                {summary.falseAlarms.length}
              </span>
              <span className="text-[12px] font-medium leading-snug" style={{ color: INK_SOFT }}>
                {summary.falseAlarms.length === 1 ? 'real message blocked' : 'real messages blocked'}
              </span>
            </div>
          </div>

          <div
            className="mt-4 pt-3.5 text-[12.5px] font-medium leading-relaxed"
            style={{ borderTop: `1px solid ${HAIRLINE}`, color: INK_SOFT }}
          >
            Fraud is priced both ways. Trusting the wrong message costs you money, and doubting every message costs you the real ones.
          </div>
          <div className="mt-2.5 text-[13.5px] leading-snug" style={{ ...SERIF, color: INK }}>
            <span style={{ ...DISPLAY, fontWeight: 700 }}>{macro.stat}</span> {macroTail}.
          </div>
          <div className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em]" style={{ ...MONO, color: INK_MICRO }}>
            {macro.source}
          </div>
        </motion.div>

        {/* Progression / Claim */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.26, ease: EASE_OUT }}
          className="rounded-[24px] p-6 relative"
          style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_MD }}
        >
          {profile ? (
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-center pb-3" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                <div className="font-semibold text-[14px]">{profile.name}</div>
                {submitState === 'success' && submitData && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="font-semibold text-[12px] px-3 py-1 rounded-full tabular-nums"
                    style={{ color: LEGIT, backgroundColor: LEGIT_SOFT }}
                  >
                    Rank #{submitData.rank}
                  </motion.div>
                )}
                {submitState === 'submitting' && (
                  <div className="font-medium text-[10px] uppercase tracking-[0.16em]" style={{ ...MONO, color: INK_MICRO }}>Saving...</div>
                )}
                {submitState === 'error' && (
                  submitErrorMsg ? (
                    <div className="text-[11px] font-semibold" style={{ color: SCAM }}>{submitErrorMsg}</div>
                  ) : (
                    <Pressable
                      onClick={doSubmit}
                      className="text-[11px] font-semibold px-3 py-1 rounded-full"
                      style={{ color: INK, backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_SM }}
                    >
                      Retry save
                    </Pressable>
                  )
                )}
              </div>

              <div className="flex justify-between items-baseline">
                <div className="text-[19px]" style={{ ...DISPLAY, fontWeight: 700 }}>
                  {submitData ? submitData.levelTitle : LEVEL_TITLES[0]}
                </div>
                <div className="tabular-nums text-[11px] font-medium uppercase tracking-[0.16em]" style={{ ...MONO, color: INK_MICRO }}>LVL {submitData?.level || 1}</div>
              </div>

              <div className="text-[13px] -mt-2" style={{ ...SERIF, color: INK_SOFT }}>
                {levelTagline(submitData?.level || 1)}
              </div>

              <div className="h-2.5 rounded-full overflow-hidden relative" style={{ backgroundColor: 'rgba(34,27,22,0.08)' }}>
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${progressStart * 100}%`, backgroundColor: GOLD }} />
                {stage !== 'initial' && submitData && (
                  <motion.div
                    initial={{ width: `${progressStart * 100}%` }}
                    animate={{
                      width: crossesLevel
                        ? ['100%', '0%', `${progressEnd * 100}%`]
                        : `${progressEnd * 100}%`
                    }}
                    transition={{ duration: 1.5, ease: EASE_OUT, times: crossesLevel ? [0.4, 0.41, 1] : undefined }}
                    onAnimationComplete={() => {
                      setStage('xpDone');
                      if (crossesLevel) sound.play('levelup');
                    }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: GOLD }}
                  />
                )}
              </div>

              {submitData && (
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] -mt-1" style={{ ...MONO, color: INK_MICRO }}>
                  {submitData.level >= LEVEL_TITLES.length
                    ? 'Top of the ladder'
                    : `Next: ${LEVEL_TITLES[Math.min(submitData.level, LEVEL_TITLES.length - 1)]}`}
                </div>
              )}

              <AnimatePresence>
                {crossesLevel && stage === 'xpDone' && submitData && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    className="p-3.5 rounded-2xl text-center font-semibold text-[14px]"
                    style={{ backgroundColor: GOLD, color: SURFACE, border: BORDER_INK, boxShadow: PREMIUM_CARD_SM }}
                  >
                    Promoted. You are now {submitData.levelTitle}.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <div className="text-[19px] mb-1.5" style={{ ...DISPLAY, fontWeight: 700 }}>
                  Claim this score
                </div>
                <div className="text-[13px] font-medium leading-relaxed" style={{ color: INK_SOFT }}>
                  {submitState === 'expired'
                    ? 'That session expired. Grab a fresh name to rejoin the board.'
                    : 'Sign the ledger to enter the leaderboard.'}
                </div>
              </div>
              <form onSubmit={handleClaim} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={claimName}
                  onChange={e => setClaimName(e.target.value)}
                  placeholder="2-16 chars"
                  maxLength={16}
                  disabled={claiming}
                  aria-label="Your leaderboard name"
                  aria-invalid={claimError ? true : undefined}
                  aria-describedby={claimError ? 'claim-name-error' : undefined}
                  className="fiq-ring flex-1 min-w-0 rounded-xl px-4 py-3 font-medium text-[14px] transition-all disabled:opacity-50"
                  style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE_STRONG}`, color: INK }}
                />
                <Pressable
                  type="submit"
                  tactile
                  disabled={claiming}
                  className="rounded-xl px-6 py-3 font-semibold text-[14px] disabled:opacity-50"
                  style={{ backgroundColor: INK, color: PAPER_ON_INK, border: BORDER_INK }}
                >
                  {claiming ? 'Saving...' : 'Sign'}
                </Pressable>
              </form>
              {claimError && (
                <div id="claim-name-error" role="alert" className="font-semibold text-[12px]" style={{ color: SCAM }}>{claimError}</div>
              )}
              {!storageAvailable && (
                <div className="text-[11px] font-medium leading-relaxed" style={{ color: INK_SOFT }}>
                  This browser view blocks local storage, so your signed name will not survive a refresh here. Open the app in a regular tab to keep it.
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Case files recovered this run: the collectible knowledge beat */}
        {runIntel.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16, ease: EASE_OUT }}
            className="rounded-[24px] p-5"
            style={{ backgroundColor: SURFACE, border: BORDER_INK }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-[15px]" style={{ ...DISPLAY, fontWeight: 700 }}>
                Case files recovered
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums"
                style={{ ...MONO, backgroundColor: GOLD_SOFT, color: GOLD_TEXT }}
              >
                +{runIntel.length}
              </span>
            </div>
            <div className="flex flex-col">
              {runIntel.map((f) => (
                <div
                  key={f.id}
                  className="flex items-start gap-3 py-2 border-b last:border-b-0"
                  style={{ borderColor: 'rgba(34,27,22,0.08)' }}
                >
                  <span
                    className="shrink-0 w-[72px] text-right text-[11.5px] font-bold tabular-nums leading-snug break-words"
                    style={{ ...MONO, color: f.rarity === 'common' ? SCAM : GOLD_TEXT }}
                  >
                    {f.stat}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold leading-snug" style={{ color: INK }}>
                      {f.headline}
                    </div>
                    {f.rarity !== 'common' && (
                      <div className="mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.18em]" style={{ ...MONO, color: GOLD_TEXT }}>
                        {f.rarity === 'classified' ? 'Classified file' : 'Rare file'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] font-medium uppercase tracking-[0.14em] text-center" style={{ ...MONO, color: INK_SOFT }}>
              Archived in your profile
            </div>
          </motion.div>
        )}

        {/* Paranoia Tax */}
        {summary.falseAlarms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32, ease: EASE_OUT }}
            className="rounded-2xl p-5"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_SM }}
          >
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] mb-2" style={{ ...MONO, color: GOLD_TEXT }}>Paranoia tax</div>
            <div className="text-[20px] mb-1.5" style={{ ...DISPLAY, fontWeight: 700 }}>{summary.falseAlarms.length} false alarms</div>
            <div className="text-[13px] font-medium leading-relaxed" style={{ color: INK_SOFT }}>
              You flagged real messages as scams. Being too paranoid costs you too.
            </div>
          </motion.div>
        )}

        {/* Missed Scams */}
        {summary.missedScams.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.36 }}
            className="flex flex-col gap-3.5"
          >
            <h2 className="text-[18px] m-0" style={{ ...DISPLAY, fontWeight: 700 }}>Exhibits missed</h2>
            {summary.missedScams.map((result, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_SM }}>
                <div
                  className="mb-3 uppercase text-[10px] font-semibold tracking-[0.12em] inline-block px-2.5 py-1 rounded-full"
                  style={{ ...MONO, color: SCAM, backgroundColor: SCAM_SOFT }}
                >
                  {result.card.category} scam
                </div>
                {result.card.tells?.map((tell, j) => (
                  <div key={j} className="text-sm mb-3 last:mb-0 leading-relaxed pl-3 py-1" style={{ borderLeft: `2px solid ${SCAM}` }}>
                    <div
                      className="mb-1 uppercase tracking-[0.08em] text-[10px] font-semibold inline-block px-1.5 py-0.5 rounded"
                      style={{ ...MONO, color: SCAM, backgroundColor: SCAM_SOFT }}
                    >
                      "{tell.span}"
                    </div>
                    <div className="font-medium text-[13px]" style={{ color: INK_SOFT }}>{tell.why}</div>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: EASE_OUT }}
          className="flex flex-col gap-3 mt-1"
        >
          {mode === 'daily' && (
            <Pressable
              tactile
              onClick={handleShare}
              className="w-full rounded-2xl py-4 font-semibold text-[15px]"
              style={{ backgroundColor: SURFACE, color: INK, border: BORDER_INK }}
            >
              {copied ? 'Copied to clipboard' : "Share today's result"}
            </Pressable>
          )}

          <Pressable
            tactile="lg"
            onClick={onReplay}
            className="w-full rounded-[18px] py-[18px] flex items-center justify-center"
            style={{ backgroundColor: INK, border: BORDER_INK }}
          >
            <span className="text-[19px] uppercase tracking-[0.08em]" style={{ ...DISPLAY, fontWeight: 700, color: PAPER_ON_INK }}>{replayLabel}</span>
          </Pressable>

          <div className="grid grid-cols-2 gap-3">
            <Pressable
              tactile
              onClick={onHome}
              className="rounded-2xl py-4 flex items-center justify-center"
              style={{ backgroundColor: SURFACE, border: BORDER_INK }}
            >
              <span className="text-[15px] font-semibold">Back to menu</span>
            </Pressable>
            <Pressable
              tactile
              onClick={onViewLeaderboard}
              className="rounded-2xl py-4 flex items-center justify-center"
              style={{ backgroundColor: SURFACE, border: BORDER_INK }}
            >
              <span className="text-[15px] font-semibold">Leaderboard</span>
            </Pressable>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
