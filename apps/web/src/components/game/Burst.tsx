import { motion, useReducedMotion } from 'framer-motion';
import { INK, GOLD, LEGIT } from '@/lib/ui';

/**
 * Milestone confetti: a calm radial burst of gold and ink particles for
 * boss and streak moments. Pure divs, ~700ms, no canvas, and it renders
 * nothing under reduced motion.
 */
const PIECES = Array.from({ length: 12 }, (_, i) => i);
const COLORS = [GOLD, INK, LEGIT, '#E4B45C'];

export function Burst() {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {PIECES.map((i) => {
        const angle = (i / PIECES.length) * Math.PI * 2 + (i % 3) * 0.35;
        const dist = 90 + (i % 5) * 28;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        const bar = i % 3 === 0;
        return (
          <motion.span
            key={i}
            className="absolute"
            style={{
              width: bar ? 14 : 7,
              height: bar ? 5 : 7,
              borderRadius: bar ? 3 : 999,
              backgroundColor: COLORS[i % COLORS.length],
            }}
            initial={{ x: 0, y: 0, opacity: 0.9, rotate: 0, scale: 1 }}
            animate={{
              x,
              y: y + 64,
              opacity: [0.9, 0.9, 0],
              rotate: (i % 2 ? 1 : -1) * (120 + i * 14),
              scale: 0.8,
            }}
            transition={{ duration: 0.7, ease: [0.12, 0.8, 0.32, 1] }}
          />
        );
      })}
    </div>
  );
}
