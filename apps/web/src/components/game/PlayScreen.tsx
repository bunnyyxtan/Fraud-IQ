import { useEffect, useRef, useState } from 'react';
import { Choice, Country, GameMode, RoundResult, SESSION_LENGTH, TIMER_SECONDS, formatMoney } from '@/lib/game';
import { GameCard } from '@/data/cards';
import { CardDisplay } from './CardDisplay';
import { CountUp } from './CountUp';
import { Burst } from './Burst';
import { sound } from '@/lib/sound';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  BODY, DISPLAY, MONO,
  INK, INK_SOFT, INK_FAINT, INK_MICRO, HAIRLINE, SURFACE, PAPER_ON_INK,
  SCAM, SCAM_SOFT, LEGIT, LEGIT_SOFT, GOLD, GOLD_TEXT, GOLD_SOFT,
  SHADOW_SM, SHADOW_MD, SHADOW_LG,
  BORDER_INK,
  SPRING_SNAP, EASE_OUT,
  Pressable,
} from '@/lib/ui';

interface PlayScreenProps {
  card: GameCard;
  lives: number;
  streak: number;
  score: number;
  totalCards: number;
  currentIndex: number;
  mode?: GameMode;
  /** player's region; money chips render in local currency */
  country?: Country;
  onChoice: (choice: Choice, remainingMs: number) => void;
  feedbackResult?: RoundResult;
  onNext?: () => void;
  /** mid-run bail back to the menu; renders the header quit button when set */
  onQuit?: () => void;
}

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.8}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const BoltIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

// Circular SVG timer wired to the live remaining-time percentage.
// The ring starts at 12 o'clock (the -90deg transform draws it there;
// that is geometry, not decoration) and drains clockwise. Color stages
// the urgency: ink, then gold past half, then red in the final quarter.
function CircularTimer({ percentage, seconds, isLow }: { percentage: number; seconds: number; isLow: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const R = 20;
  const C = 2 * Math.PI * R; // circumference
  const offset = C * (1 - Math.max(0, Math.min(1, percentage / 100)));
  const ringColor = isLow ? SCAM : percentage < 50 ? GOLD : INK;
  // Coarse spoken label: announcing every tick would spam a screen reader, so
  // this only crosses a boundary a handful of times per round. The visual
  // number below is aria-hidden; this container carries the accessible value.
  const coarse =
    seconds <= 0 ? 'Time up' :
    seconds <= 5 ? `${seconds} seconds left` :
    seconds <= 10 ? 'About 10 seconds left' :
    'About 15 seconds left';
  return (
    <div
      className="relative w-[60px] h-[60px] flex items-center justify-center rounded-full shrink-0"
      style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_SM }}
      aria-label={coarse}
    >
      <svg aria-hidden="true" width="54" height="54" viewBox="0 0 54 54" className="absolute inset-0 m-auto -rotate-90 overflow-visible">
        <circle cx="27" cy="27" r={R} fill="transparent" stroke="rgba(34,27,22,0.10)" strokeWidth="4" />
        <circle
          cx="27"
          cy="27"
          r={R}
          fill="transparent"
          stroke={ringColor}
          strokeWidth="4"
          strokeDasharray={C}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.12s linear, stroke 0.2s linear' }}
        />
      </svg>
      <motion.span
        aria-hidden="true"
        className="relative z-10 inline-block tabular-nums text-[22px]"
        animate={isLow && seconds > 0 && !prefersReducedMotion ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={isLow && !prefersReducedMotion ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
        style={{ ...DISPLAY, fontWeight: 700, color: ringColor, transition: 'color 0.2s linear' }}
      >
        {seconds}
      </motion.span>
    </div>
  );
}

/**
 * Per-case feedback. Correct answers appear 13 times a run, so the happy
 * path stays quiet and fast: a paper wash, one confident number, small
 * chips. Delight (burst) is reserved for the rare beats: streak
 * milestones and the boss.
 */
function FeedbackOverlay({ result, onNext, country }: { result: RoundResult, onNext?: () => void, country?: Country }) {
  const { correct, card, choice } = result;
  const prefersReducedMotion = useReducedMotion();

  if (correct) {
    const milestone = result.streak >= 3 && result.streak % 3 === 0;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(250,244,232,0.93)' }}
      >
        {(milestone || card.boss) && <Burst />}

        <motion.div
          initial={{ scale: prefersReducedMotion ? 1 : 1.06, opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={SPRING_SNAP}
          className="flex items-baseline gap-2 tabular-nums"
          style={{ color: LEGIT }}
        >
          <span className="text-[64px] leading-none" style={{ ...DISPLAY, fontWeight: 800 }}>
            +<CountUp end={result.points} format={(v) => v.toString()} duration={450} />
          </span>
          <span className="text-[18px] font-semibold" style={BODY}>pts</span>
        </motion.div>

        <div className="mt-5 flex flex-col items-center gap-2.5">
          {card.boss && (
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.08, ease: EASE_OUT }}
              className="px-4 py-1.5 rounded-full text-[12px] font-semibold"
              style={{ ...BODY, backgroundColor: GOLD_SOFT, color: GOLD_TEXT, border: '1px solid rgba(201,138,27,0.30)' }}
            >
              Boss down. Double points.
            </motion.div>
          )}

          {card.isScam && card.lossAmount ? (
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.12, ease: EASE_OUT }}
              className="px-4 py-1.5 rounded-full text-[15px] font-semibold tabular-nums"
              style={{ ...BODY, backgroundColor: LEGIT_SOFT, color: LEGIT }}
            >
              {formatMoney(card.lossAmount, country)} saved
            </motion.div>
          ) : null}

          {milestone && (
            <motion.div
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...SPRING_SNAP, delay: 0.16 }}
              className="px-4 py-1.5 rounded-full text-[16px]"
              style={{ ...DISPLAY, fontWeight: 700, backgroundColor: GOLD, color: SURFACE, boxShadow: SHADOW_SM }}
            >
              Streak x{result.streak}
            </motion.div>
          )}

          {milestone && result.streak >= 6 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.24 }}
              className="text-[10px] font-medium uppercase tracking-[0.24em]"
              style={{ ...MONO, color: GOLD_TEXT }}
            >
              {result.streak >= 12 ? 'flawless radar' : result.streak >= 9 ? 'certified menace' : 'locked in'}
            </motion.div>
          )}

          {card.isScam && card.tells && card.tells[0] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.18 }}
              className="text-center max-w-[82%] text-[13px] leading-relaxed font-medium mt-1.5 px-4 py-3 rounded-xl"
              style={{ ...BODY, backgroundColor: SURFACE, color: INK_SOFT, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_SM }}
            >
              {card.tells[0].why}
            </motion.div>
          )}
        </div>

        <div className="mt-8 text-[10px] font-medium uppercase tracking-[0.2em]" style={{ ...MONO, color: INK_MICRO }}>
          Tap to continue
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="absolute inset-0 backdrop-blur-md p-6 md:p-7 flex flex-col justify-center z-50 overflow-y-auto rounded-[24px]"
      style={{ ...BODY, backgroundColor: 'rgba(255,253,249,0.98)', color: INK, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_LG }}
    >
      <div className="text-center mb-7 shrink-0 mt-3 pb-6" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
        <h2 className="text-[34px] leading-none mb-2.5 m-0" style={{ ...DISPLAY, fontWeight: 800, color: SCAM }}>
          {choice === 'timeout' ? 'Time up' : 'Wrong call'}
        </h2>
        <p className="text-[13px] font-medium m-0" style={{ color: INK_SOFT }}>
          {card.boss
            ? (card.isScam ? 'The boss got you. It was a scam.' : 'The boss got you. It was legit.')
            : (card.isScam ? 'This one was a scam.' : 'This one was legit.')}
        </p>
      </div>

      <div className="space-y-4 mb-7 text-base leading-relaxed flex-1 overflow-y-auto pr-2">
        {card.isScam ? (
          card.tells?.map((tell, i) => (
            <div key={i} className="pl-4 py-1" style={{ borderLeft: `2px solid ${SCAM}` }}>
              <div
                className="mb-1.5 uppercase tracking-[0.08em] text-[10px] font-semibold inline-block px-1.5 py-0.5 rounded"
                style={{ ...MONO, backgroundColor: SCAM_SOFT, color: SCAM }}
              >
                "{tell.span}"
              </div>
              <div className="text-[13.5px]" style={{ color: INK_SOFT }}>{tell.why}</div>
            </div>
          ))
        ) : (
          <div className="pl-4 py-1" style={{ borderLeft: `2px solid ${LEGIT}` }}>
            <div
              className="mb-1.5 uppercase tracking-[0.08em] text-[10px] font-semibold inline-block px-1.5 py-0.5 rounded"
              style={{ ...MONO, backgroundColor: LEGIT_SOFT, color: LEGIT }}
            >
              Green flags
            </div>
            <div className="text-[13.5px]" style={{ color: INK_SOFT }}>{card.legitNote}</div>
          </div>
        )}
      </div>

      <div className="shrink-0 mb-1">
        <Pressable
          tactile
          onClick={onNext}
          className="w-full py-4 text-[15px] font-semibold rounded-2xl"
          style={{ ...BODY, backgroundColor: INK, color: PAPER_ON_INK, border: BORDER_INK }}
        >
          Got it, next case (Space)
        </Pressable>
      </div>
    </motion.div>
  );
}

export function PlayScreen({
  card, lives, streak, score, totalCards, currentIndex, mode, country, onChoice, feedbackResult, onNext, onQuit
}: PlayScreenProps) {
  const [remainingMs, setRemainingMs] = useState(TIMER_SECONDS * 1000);
  const startRef = useRef(performance.now());
  const lastSecRef = useRef(TIMER_SECONDS);
  /** live countdown mirror so the timer can pause and resume without refilling */
  const remainingRef = useRef(TIMER_SECONDS * 1000);
  const [muted, setMuted] = useState(() => sound.isMuted());
  /** quit confirm dialog; the clock holds while it is open */
  const [quitOpen, setQuitOpen] = useState(false);
  /** element focused before the quit dialog opened, so focus can be restored on close */
  const quitOpenerRef = useRef<HTMLElement | null>(null);
  /* boss cards open with a cinematic gate; the timer waits behind it */
  const [bossIntroDone, setBossIntroDone] = useState(false);
  const isPlaying = !feedbackResult;
  const isBossGate = !!card.boss && !bossIntroDone && isPlaying;

  useEffect(() => {
    setBossIntroDone(false);
    setRemainingMs(TIMER_SECONDS * 1000);
    remainingRef.current = TIMER_SECONDS * 1000;
    setQuitOpen(false);
  }, [card.id]);

  // Focus restoration for the quit dialog: hand focus back to whatever opened
  // it once it closes, so keyboard users are not dumped at the top of the
  // document. The opener is captured synchronously at open time (see
  // openQuit); the dialog itself then moves focus inward (Keep playing
  // autoFocuses). This effect only handles the restore on close.
  useEffect(() => {
    if (quitOpen) return;
    const opener = quitOpenerRef.current;
    if (opener) {
      quitOpenerRef.current = null;
      if (typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus();
      }
    }
  }, [quitOpen]);

  // Open the quit dialog, remembering the currently focused control first so
  // focus can be returned there on close. Both the header X and the Escape
  // key route through here.
  const openQuit = () => {
    quitOpenerRef.current = document.activeElement as HTMLElement | null;
    setQuitOpen(true);
  };

  useEffect(() => {
    // The intro holds while the quit dialog covers it; closing replays it in full.
    if (!isBossGate || quitOpen) return;
    sound.play('boss');
    const t = setTimeout(() => setBossIntroDone(true), 2600);
    return () => clearTimeout(t);
  }, [isBossGate, quitOpen]);

  useEffect(() => {
    if (!isPlaying || isBossGate || quitOpen) return;

    // Resume from wherever the countdown stood; fresh cards reset the ref,
    // so closing the quit dialog never refills the clock.
    startRef.current = performance.now() - (TIMER_SECONDS * 1000 - remainingRef.current);
    lastSecRef.current = Math.ceil(remainingRef.current / 1000);
    let frame: number;
    const loop = (now: number) => {
      const elapsed = now - startRef.current;
      const left = Math.max(0, TIMER_SECONDS * 1000 - elapsed);
      remainingRef.current = left;
      setRemainingMs(left);

      const sec = Math.ceil(left / 1000);
      if (sec !== lastSecRef.current) {
        lastSecRef.current = sec;
        if (sec <= 5 && sec > 0) sound.play('tick');
      }

      if (left > 0) {
        frame = requestAnimationFrame(loop);
      } else {
        onChoice('timeout', 0);
      }
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [card.id, isPlaying, isBossGate, quitOpen, onChoice]);

  // Audio and haptic cue the moment feedback lands
  useEffect(() => {
    if (!feedbackResult) return;
    if (feedbackResult.correct) {
      const milestone = feedbackResult.streak >= 3 && feedbackResult.streak % 3 === 0;
      sound.play(milestone ? 'streak' : 'correct');
      sound.buzz(milestone ? [14, 40, 18, 40, 26] : [12, 50, 22]);
    } else {
      sound.play('wrong');
      sound.buzz(70);
    }
  }, [feedbackResult]);

  // Once the outcome is decided (last card answered or last life gone) the
  // run is already on the books; quitting means nothing anymore, so every
  // quit affordance hides until the results screen takes over.
  const isTerminalFeedback = !!feedbackResult && (lives <= 0 || currentIndex >= totalCards - 1);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; /* held keys must not machine-gun through cards */
      if (e.key === 'Escape' && onQuit && !isTerminalFeedback) {
        if (quitOpen) setQuitOpen(false);
        else openQuit();
        return;
      }
      if (quitOpen) return; /* the quit dialog owns input until dismissed */
      if (isBossGate) return; /* no answering through the boss cinematic */
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        sound.unlock();
      }
      if (isPlaying) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') sound.play('press');
        if (e.key === 'ArrowLeft') onChoice('scam', remainingMs);
        if (e.key === 'ArrowRight') onChoice('legit', remainingMs);
      } else if (feedbackResult && onNext) {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, feedbackResult, remainingMs, onChoice, onNext, onQuit, quitOpen, isBossGate, isTerminalFeedback]);

  useEffect(() => {
    if (feedbackResult && feedbackResult.correct && onNext && !quitOpen) {
      const t = setTimeout(() => {
        onNext();
      }, 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [feedbackResult, onNext, quitOpen]);

  const percentage = (remainingMs / (TIMER_SECONDS * 1000)) * 100;
  const isLowTime = percentage < 25;
  const displaySeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const prefersReducedMotion = useReducedMotion();

  // Spoken verdict for screen readers: mirrors the visual FeedbackOverlay so
  // the correct/wrong outcome is announced, not just shown.
  const verdictAnnouncement = feedbackResult
    ? feedbackResult.correct
      ? `Correct. Plus ${feedbackResult.points} points.`
      : feedbackResult.choice === 'timeout'
        ? `Time up. This one was ${card.isScam ? 'a scam' : 'legit'}.`
        : `Wrong call. This one was ${card.isScam ? 'a scam' : 'legit'}.`
    : '';
  // Case position, announced as each new card comes up (not while feedback shows).
  const caseAnnouncement = isPlaying && !isBossGate
    ? card.boss
      ? 'Boss case'
      : `Case ${currentIndex + 1} of ${SESSION_LENGTH}`
    : '';

  const toggleMute = () => {
    const next = sound.toggle();
    if (!next) sound.unlock();
    setMuted(next);
  };

  return (
    <main
      className="flex flex-col h-[100dvh] max-w-[440px] mx-auto w-full px-5 pt-7 pb-6 relative"
      style={{ ...BODY, color: INK }}
      onClick={!quitOpen && feedbackResult?.correct && onNext ? () => onNext() : undefined}
    >
      {/* Screen-reader announcements: verdict and case position. Polite +
          atomic so the whole phrase is read as one, and never mid-word. The
          countdown is deliberately NOT a live region (it would spam per tick). */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {verdictAnnouncement}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {caseAnnouncement}
      </div>

      {/* Boss intro: full takeover, timer holds until dismissed */}
      <AnimatePresence>
        {isBossGate && (
          <motion.div
            key="boss-gate"
            role="dialog"
            aria-modal="true"
            aria-label="Final case. Boss round, double points. Tap when ready."
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            onClick={() => {
              sound.play('press');
              setBossIntroDone(true);
            }}
            className="fixed inset-0 z-[60] backdrop-blur-md flex flex-col items-center justify-center text-center p-8 cursor-pointer"
            style={{ backgroundColor: 'rgba(250,244,232,0.97)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="text-[11px] font-medium uppercase tracking-[0.24em] mb-4"
              style={{ ...MONO, color: GOLD_TEXT }}
            >
              Double points
            </motion.div>
            <motion.div
              initial={{ scale: prefersReducedMotion ? 1 : 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="text-[56px] md:text-[72px] leading-[0.95] mb-5"
              style={{ ...DISPLAY, fontWeight: 800, color: INK }}
            >
              Final Case
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: EASE_OUT }}
              className="h-[3px] w-14 rounded-full mb-6"
              style={{ backgroundColor: SCAM }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="font-medium text-[15px] max-w-sm leading-relaxed"
              style={{ color: INK_SOFT }}
            >
              This one fools almost everyone. Tap when ready.
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Quit confirm: the countdown holds while this is open */}
      <AnimatePresence>
        {quitOpen && (
          <motion.div
            key="quit-gate"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quit-dialog-title"
            aria-describedby="quit-dialog-desc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={(e) => {
              e.stopPropagation();
              setQuitOpen(false);
            }}
            className="fixed inset-0 z-[70] backdrop-blur-sm flex items-center justify-center p-6"
            style={{ backgroundColor: 'rgba(34,27,22,0.32)' }}
          >
            <motion.div
              initial={{ scale: prefersReducedMotion ? 1 : 0.97, y: prefersReducedMotion ? 0 : 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: prefersReducedMotion ? 1 : 0.97, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                /* keep Tab inside the dialog so focus never reaches the game underneath */
                if (e.key !== 'Tab') return;
                const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('button');
                const first = buttons[0];
                const last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }}
              className="p-7 w-full max-w-sm rounded-[24px]"
              style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_LG }}
            >
              <div id="quit-dialog-title" className="text-[24px] mb-2" style={{ ...DISPLAY, fontWeight: 700 }}>Quit this run?</div>
              <p id="quit-dialog-desc" className="text-[13px] font-medium mb-7 leading-relaxed" style={{ color: INK_SOFT }}>
                {mode === 'daily'
                  ? "Progress is lost, but today's gauntlet stays open until you finish a run."
                  : "This run's score and progress will be lost."}
              </p>
              <div className="flex flex-col gap-2.5">
                <Pressable
                  autoFocus
                  pressScale={0.98}
                  onClick={() => setQuitOpen(false)}
                  className="w-full py-3.5 text-[14px] font-semibold rounded-2xl"
                  style={{ backgroundColor: INK, color: PAPER_ON_INK, boxShadow: SHADOW_MD }}
                >
                  Keep playing
                </Pressable>
                <Pressable
                  pressScale={0.98}
                  onClick={() => {
                    setQuitOpen(false);
                    onQuit?.();
                  }}
                  className="w-full py-3.5 text-[14px] font-semibold rounded-2xl"
                  style={{ backgroundColor: SURFACE, color: SCAM, border: `1px solid rgba(196,69,54,0.35)` }}
                >
                  Quit to menu
                </Pressable>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Ambient pressure: warm red vignette pulse when time runs low */}
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(196,69,54,0.20) 100%)' }}
        initial={false}
        animate={
          isPlaying && isLowTime
            ? prefersReducedMotion
              ? { opacity: 0.7 }
              : { opacity: [0.45, 0.85, 0.45] }
            : { opacity: 0 }
        }
        transition={
          isPlaying && isLowTime && !prefersReducedMotion
            ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
            : { duration: prefersReducedMotion ? 0 : 0.4 }
        }
      />
      {/* Streak heat: soft gold glow from the corners at 3+ */}
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 85% 90%, rgba(201,138,27,0.16), transparent 45%), radial-gradient(circle at 12% 88%, rgba(201,138,27,0.11), transparent 40%)' }}
        initial={false}
        animate={{ opacity: isPlaying && streak >= 3 ? (streak >= 9 ? 1 : streak >= 6 ? 0.75 : 0.5) : 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
      />

      {/* Header row: lives | streak pill | score pill | mute | quit */}
      <div className="flex justify-between items-center gap-2 shrink-0 mb-5">
        <div
          className="flex items-center gap-1"
          style={{ color: SCAM }}
          role="img"
          aria-label={`${lives} of 3 lives left`}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ opacity: i < lives ? 1 : 0.18, scale: i < lives ? 1 : 0.9 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              <HeartIcon filled={i < lives} />
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {streak > 2 && (() => {
              /* streak heat: the pill itself warms up at 6 and ignites at 9 */
              const heat = streak >= 9 ? 2 : streak >= 6 ? 1 : 0;
              const heatStyle =
                heat === 2
                  ? { backgroundColor: INK, border: '1px solid rgba(20,16,12,0.9)', boxShadow: SHADOW_SM, color: GOLD }
                  : heat === 1
                    ? { backgroundColor: GOLD_SOFT, border: '1px solid rgba(201,138,27,0.45)', boxShadow: SHADOW_SM, color: INK }
                    : { backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_SM };
              return (
                <motion.div
                  key={heat}
                  initial={{ opacity: 0, x: -5, scale: heat > 0 ? 0.9 : 1 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 5 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold tabular-nums"
                  style={heatStyle}
                >
                  <span style={{ color: GOLD }}><BoltIcon /></span>
                  {heat === 2 ? `On fire ${streak}` : `Streak ${streak}`}
                </motion.div>
              );
            })()}
          </AnimatePresence>

          <motion.div
            key={score}
            initial={prefersReducedMotion ? false : { scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={SPRING_SNAP}
            className="px-4 py-1.5 rounded-full text-[12.5px] font-semibold tabular-nums"
            style={{ backgroundColor: INK, color: PAPER_ON_INK, boxShadow: SHADOW_SM }}
            aria-label={`Score ${score}`}
          >
            Score {score}
          </motion.div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            aria-pressed={muted}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            className="fiq-ring p-2 rounded-full shrink-0"
            style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, color: INK_SOFT }}
          >
            {muted ? (
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><line x1="22" x2="16" y1="9" y2="15" /><line x1="16" x2="22" y1="9" y2="15" /></svg>
            ) : (
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
            )}
          </button>
          {onQuit && !isTerminalFeedback && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openQuit();
              }}
              aria-label="Quit run"
              className="fiq-ring p-2 rounded-full shrink-0"
              style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, color: INK_SOFT }}
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Round label + circular timer */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase" style={{ ...MONO, color: INK_MICRO }}>
            {mode === 'daily' ? 'Daily round' : 'Round'}
          </span>
          <span className="text-[26px] leading-none mt-1.5 truncate" style={{ ...DISPLAY, fontWeight: 700 }}>
            {card.boss ? (
              <span style={{ color: SCAM }}>Boss Case</span>
            ) : (
              `Case ${currentIndex + 1} of ${SESSION_LENGTH}`
            )}
          </span>
        </div>
        <CircularTimer percentage={percentage} seconds={displaySeconds} isLow={isLowTime} />
      </div>

      {/* Card wrapper (tap anywhere to continue during correct feedback) */}
      <div
        className={`flex-1 relative min-h-0 mb-5 w-full mx-auto ${feedbackResult?.correct ? 'cursor-pointer' : ''}`}
        style={card.boss ? { borderRadius: '24px', boxShadow: `0 0 0 2px ${SCAM}, 0 0 36px rgba(196,69,54,0.22)` } : undefined}
      >
        <AnimatePresence>
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20, scale: prefersReducedMotion ? 1 : 0.99 }}
            animate={
              feedbackResult && !feedbackResult.correct && !prefersReducedMotion
                ? { opacity: 1, y: 0, scale: 1, x: [0, -10, 8, -5, 3, 0] }
                : { opacity: 1, y: 0, scale: 1, x: 0 }
            }
            exit={{ opacity: 0, scale: 0.985, y: prefersReducedMotion ? 0 : -14, transition: { duration: 0.16, ease: 'easeIn' } }}
            transition={{ duration: 0.28, ease: EASE_OUT, x: { duration: 0.36, ease: 'easeOut' } }}
            className="h-full absolute inset-0"
          >
            <CardDisplay card={card} showTells={!!feedbackResult} />
          </motion.div>
        </AnimatePresence>

        {/* Feedback overlay */}
        {feedbackResult && (
          <FeedbackOverlay result={feedbackResult} country={country} onNext={quitOpen ? undefined : onNext} />
        )}
      </div>

      {/* Actions: SCAM / LEGIT */}
      <div className="grid grid-cols-2 gap-4 h-[92px] shrink-0 w-full">
        <Pressable
          disabled={!isPlaying || quitOpen}
          onClick={() => {
            sound.unlock();
            onChoice('scam', remainingMs);
          }}
          tactile
          className="flex flex-col items-center justify-center rounded-[20px] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: SCAM, border: BORDER_INK }}
        >
          <span className="text-[24px] uppercase tracking-[0.1em]" style={{ ...DISPLAY, fontWeight: 700, color: '#FFF6EC' }}>Scam</span>
          <kbd className="hidden md:inline-flex items-center justify-center mt-1 h-5 px-1.5 rounded-md text-[10px] font-semibold" style={{ ...MONO, backgroundColor: 'rgba(0,0,0,0.20)', color: 'rgba(255,246,236,0.92)' }}>&larr;</kbd>
        </Pressable>
        <Pressable
          disabled={!isPlaying || quitOpen}
          onClick={() => {
            sound.unlock();
            onChoice('legit', remainingMs);
          }}
          tactile
          className="flex flex-col items-center justify-center rounded-[20px] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: LEGIT, border: BORDER_INK }}
        >
          <span className="text-[24px] uppercase tracking-[0.1em]" style={{ ...DISPLAY, fontWeight: 700, color: '#F0F7EF' }}>Legit</span>
          <kbd className="hidden md:inline-flex items-center justify-center mt-1 h-5 px-1.5 rounded-md text-[10px] font-semibold" style={{ ...MONO, backgroundColor: 'rgba(0,0,0,0.20)', color: 'rgba(240,247,239,0.92)' }}>&rarr;</kbd>
        </Pressable>
      </div>
    </main>
  );
}
