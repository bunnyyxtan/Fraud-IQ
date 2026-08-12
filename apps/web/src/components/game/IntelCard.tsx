import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { INTEL_STATS, type IntelRarity, type IntelStat } from '@/data/intel';
import { collectIntelFile } from '@/lib/game';
import { sound } from '@/lib/sound';
import {
  BODY, DISPLAY, MONO,
  INK, INK_SOFT, INK_FAINT, INK_MICRO, HAIRLINE, SURFACE, PAPER_ON_INK,
  SCAM, GOLD, GOLD_TEXT, GOLD_SOFT,
  BORDER_INK, PREMIUM_CARD,
  EASE_OUT, SPRING_CARD,
  Pressable,
} from '@/lib/ui';

interface IntelCardProps {
  intel: IntelStat;
  /** cases answered so far, for the "checkpoint" context line */
  casesDone: number;
  onContinue: () => void;
}

const RARITY_LABEL: Record<IntelRarity, string> = {
  common: 'Field note',
  rare: 'Rare file',
  classified: 'Classified',
};

const RARITY_SOUND: Record<IntelRarity, 'press' | 'streak' | 'levelup'> = {
  common: 'press',
  rare: 'streak',
  classified: 'levelup',
};

/**
 * Case file interstitial: a between-cases checkpoint that surfaces one
 * verified real-world fraud fact matched to the scam the player just faced,
 * collected into the profile archive. A dossier cover flips open for the
 * reveal; rarity sets the foil. Full takeover, no timer, tap or Space/Enter
 * to open and then to continue.
 */
export function IntelCard({ intel, casesDone, onContinue }: IntelCardProps) {
  const prefersReducedMotion = useReducedMotion();
  // Archive the file the moment it is on screen; quitting after still counts.
  const [{ isNew, collected }] = useState(() => collectIntelFile(intel.id));
  const [revealed, setRevealed] = useState<boolean>(!!prefersReducedMotion);

  const regionPool = INTEL_STATS.filter((s) => s.region === intel.region);
  const regionCollected = regionPool.filter((s) => collected.has(s.id)).length;

  // Auto-open the dossier shortly after it lands; a tap opens it instantly.
  useEffect(() => {
    if (revealed) return;
    const t = window.setTimeout(() => setRevealed(true), 800);
    return () => window.clearTimeout(t);
  }, [revealed]);

  useEffect(() => {
    if (revealed) sound.play(RARITY_SOUND[intel.rarity]);
  }, [revealed, intel.rarity]);

  // Ghost-input guard: the tap or Space that closed the previous screen can
  // resolve into a click or key event AFTER this overlay mounts (synthesized
  // mobile clicks, key activation on release). With reduced motion the card
  // starts revealed, so that stray input would skip the file unseen. Swallow
  // everything for a beat after mount. Set during the first render, before
  // any event can possibly land.
  const armedAtRef = useRef(0);
  if (armedAtRef.current === 0) {
    armedAtRef.current = performance.now() + 600;
  }

  // Surface taps only ever OPEN the dossier. Continuing requires the explicit
  // button below the card (or a key press), so a stray click anywhere on the
  // takeover can never skip the file unseen.
  const openCover = () => {
    sound.unlock();
    if (performance.now() < armedAtRef.current || revealed) return;
    setRevealed(true);
  };

  const advance = () => {
    sound.unlock();
    if (performance.now() < armedAtRef.current) return;
    if (!revealed) {
      setRevealed(true);
      return;
    }
    onContinue();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const isRare = intel.rarity === 'rare';
  const isClassified = intel.rarity === 'classified';

  const cardStyle = isRare
    ? { backgroundColor: INK, border: '1px solid rgba(20,16,12,0.9)', boxShadow: PREMIUM_CARD }
    : isClassified
      ? {
          backgroundColor: SURFACE,
          border: '1.5px solid rgba(201,138,27,0.65)',
          boxShadow: `0 0 0 4px ${GOLD_SOFT}, ${PREMIUM_CARD}`,
        }
      : { backgroundColor: SURFACE, border: BORDER_INK, boxShadow: PREMIUM_CARD };

  const statColor = isRare || isClassified ? GOLD : SCAM;
  const headlineColor = isRare ? PAPER_ON_INK : INK;
  const detailColor = isRare ? 'rgba(250,244,232,0.72)' : INK_SOFT;
  const sourceStyle = isRare
    ? { backgroundColor: 'rgba(250,244,232,0.10)', color: 'rgba(250,244,232,0.55)' }
    : { backgroundColor: 'rgba(34,27,22,0.06)', color: INK_MICRO };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
      onClick={openCover}
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 overflow-y-auto ${revealed ? '' : 'cursor-pointer'}`}
      style={{ ...BODY, backgroundColor: 'rgba(250,244,232,0.98)', color: INK }}
      role="dialog"
      aria-modal="true"
      aria-label="Case file checkpoint"
    >
      <div className="w-full max-w-[400px] flex flex-col items-center" style={{ perspective: 1200 }}>
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="px-3.5 py-1.5 mb-5 rounded-full text-[10px] font-medium uppercase tracking-[0.22em]"
          style={{ ...MONO, backgroundColor: GOLD_SOFT, color: GOLD_TEXT, border: '1px solid rgba(201,138,27,0.30)' }}
        >
          Scam intel · {RARITY_LABEL[intel.rarity]}
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          {!revealed ? (
            <motion.div
              key="cover"
              initial={{ y: prefersReducedMotion ? 0 : 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ rotateY: -70, opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }}
              transition={{ ...SPRING_CARD, delay: 0.05 }}
              className="w-full p-7 rounded-[24px] flex flex-col items-center gap-4"
              style={{ backgroundColor: INK, border: '1px solid rgba(20,16,12,0.9)', boxShadow: PREMIUM_CARD }}
              aria-hidden="true"
            >
              <div
                className="text-[11px] font-medium uppercase tracking-[0.3em]"
                style={{ ...MONO, color: GOLD }}
              >
                Case file
              </div>
              <div className="w-full flex flex-col gap-2.5 py-2" aria-hidden="true">
                {[82, 64, 74, 42].map((w, i) => (
                  <div
                    key={i}
                    className="h-[10px] rounded-full"
                    style={{ width: `${w}%`, backgroundColor: 'rgba(250,244,232,0.14)' }}
                  />
                ))}
              </div>
              <div
                className="text-[10px] font-medium uppercase tracking-[0.22em]"
                style={{ ...MONO, color: 'rgba(250,244,232,0.45)' }}
              >
                Tap to open
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { rotateY: 70, opacity: 0 }
              }
              animate={{ rotateY: 0, opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0.2 } : { duration: 0.3, ease: EASE_OUT }}
              className="relative w-full"
            >
              <div className="w-full p-7 pb-6 rounded-[24px] text-center overflow-hidden" style={cardStyle}>
                {isClassified && (
                  <div
                    className="-mx-7 -mt-7 mb-6 py-2 text-[10px] font-medium uppercase tracking-[0.34em]"
                    style={{ ...MONO, backgroundColor: GOLD, color: SURFACE }}
                  >
                    Classified
                  </div>
                )}
                <div
                  className="text-[52px] leading-none mb-4 tabular-nums break-words"
                  style={{ ...DISPLAY, fontWeight: 800, color: statColor }}
                >
                  {intel.stat}
                </div>
                <div className="font-bold text-[17px] leading-snug mb-2.5" style={{ color: headlineColor }}>
                  {intel.headline}
                </div>
                <div className="text-[13.5px] font-medium leading-relaxed mb-5" style={{ color: detailColor }}>
                  {intel.detail}
                </div>
                <div
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-[0.12em]"
                  style={{ ...MONO, ...sourceStyle }}
                >
                  Source: {intel.source}
                </div>
                <div
                  className="mt-4 pt-3 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em]"
                  style={{
                    ...MONO,
                    color: isRare ? 'rgba(250,244,232,0.45)' : INK_MICRO,
                    borderTop: `1px solid ${isRare ? 'rgba(250,244,232,0.12)' : HAIRLINE}`,
                  }}
                >
                  <span>Archive {regionCollected}/{regionPool.length}</span>
                  <span aria-hidden="true" style={{ color: GOLD }}>·</span>
                  <span>{intel.region === 'in' ? 'India files' : 'US files'}</span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.4, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: -8 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.4, duration: 0.25, ease: EASE_OUT }}
                className="absolute -top-3 -right-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{
                  ...MONO,
                  backgroundColor: SURFACE,
                  color: isNew ? GOLD_TEXT : INK_MICRO,
                  border: isNew ? `1.5px solid ${GOLD}` : `1.5px solid ${HAIRLINE}`,
                  boxShadow: '0 2px 8px rgba(34,27,22,0.14)',
                }}
              >
                {isNew ? 'New file' : 'On file'}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.45, duration: 0.3, ease: EASE_OUT }}
            className="w-full mt-6"
          >
            <Pressable
              tactile
              onClick={advance}
              className="w-full py-4 rounded-2xl text-[15px] font-bold"
              style={{ ...BODY, backgroundColor: INK, color: PAPER_ON_INK, border: BORDER_INK }}
            >
              Filed. Next case (Space)
            </Pressable>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-4 text-[10px] font-medium uppercase tracking-[0.2em] text-center"
          style={{ ...MONO, color: INK_MICRO }}
        >
          {casesDone} cases down
        </motion.div>
      </div>
    </motion.div>
  );
}
