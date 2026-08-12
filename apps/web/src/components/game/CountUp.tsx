import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Number ticker with an exponential ease-out, shared by the results
 * reveal and the in-round points banner. Reduced motion snaps to the
 * final value immediately.
 */
export function CountUp({ end, format, onComplete, duration = 1200, delay = 0 }: { end: number, format: (v: number) => string, onComplete?: () => void, duration?: number, delay?: number }) {
  const [value, setValue] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(end);
      if (onComplete) onComplete();
      return;
    }

    setValue(0);
    let startTime: number;
    let raf = 0;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(ease * end));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        if (onComplete) onComplete();
      }
    };

    const timeout = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      /* cancel the whole chain, not just the kickoff, so rapid
         unmounts (tap-to-continue) never leave a ticker running */
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [end, prefersReducedMotion, duration, delay]); // Intentionally not including onComplete to avoid loops

  return <>{format(value)}</>;
}
