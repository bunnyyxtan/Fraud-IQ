import { motion, useReducedMotion } from 'framer-motion';

export type BackdropPhase = 'start' | 'leaderboard' | 'play' | 'results';

/**
 * Retro Cream backdrop. A calm, light cream field with a soft mustard glow
 * and a subtle dotted texture. Pointer-events none, respects reduced motion.
 * Kept intentionally uncluttered so the Retro Cream panels read cleanly.
 */

const WATERMARK: Record<BackdropPhase, string[]> = {
  start: ['SCAM', 'OR', 'LEGIT'],
  leaderboard: ['TOP', 'ANALYSTS'],
  play: ['SPOT', 'THE', 'TELL'],
  results: ['CASE', 'CLOSED'],
};

export function GameBackdrop({ phase }: { phase: BackdropPhase }) {
  const prefersReducedMotion = useReducedMotion();
  const words = WATERMARK[phase];

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none"
      style={{ backgroundColor: '#FAF4E8' }}
    >
      <style>{`
        .retro-backdrop-dots {
          background-image: radial-gradient(rgba(74,58,49,0.055) 1.5px, transparent 1.5px);
          background-size: 22px 22px;
        }
      `}</style>

      {/* soft dotted texture */}
      <div className="absolute inset-0 retro-backdrop-dots" />

      {/* warm glows, very low intensity so the field stays light */}
      <div
        className="absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(201,138,27,0.10)' }}
      />
      <div
        className="absolute -bottom-40 -left-28 w-[560px] h-[560px] rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(196,69,54,0.06)' }}
      />

      {/* giant phase watermark, ink stroke text */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <motion.div
          key={phase}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
          className="uppercase leading-[0.85] tracking-tight text-center"
          style={{
            fontFamily: "'Bricolage Grotesque Variable', sans-serif",
            fontWeight: 800,
            color: 'transparent',
            WebkitTextStroke: '1.5px rgba(34,27,22,0.05)',
          }}
        >
          {words.map((w) => (
            <div key={w} style={{ fontSize: 'clamp(80px, 18vw, 240px)' }}>{w}</div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
