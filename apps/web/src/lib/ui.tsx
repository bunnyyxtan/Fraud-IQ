import { forwardRef, type ReactNode, type CSSProperties } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { sound } from '@/lib/sound';

/**
 * Evidence Desk design language, tactile edition. Warm paper, deep espresso
 * ink, and physical objects: interactive elements carry an ink border, sit
 * on a hard offset shadow with ambient depth and an inner top highlight,
 * and visibly sink onto that shadow when pressed. Quiet surfaces keep
 * hairlines and soft shadows. No rotation anywhere.
 *
 * Motion doctrine:
 * - Press: the button compresses onto its shadow (translateY + shadow
 *   collapse), ~100ms in, tick sound on press so audio lands first.
 * - Hover lifts 1px with a slightly deeper ambient shadow.
 * - Frequent elements stay subtle and fast; rare moments carry delight.
 * - Entrances ease out in under ~300ms.
 */

// ---------- color ----------
export const PAPER = '#FAF4E8';
export const SURFACE = '#FFFDF9';
export const INK = '#221B16';
export const INK_SOFT = 'rgba(34,27,22,0.62)';
export const INK_FAINT = 'rgba(34,27,22,0.42)';
export const HAIRLINE = 'rgba(34,27,22,0.14)';
export const HAIRLINE_STRONG = 'rgba(34,27,22,0.26)';
export const SCAM = '#C44536';
export const SCAM_SOFT = 'rgba(196,69,54,0.10)';
export const LEGIT = '#3E7752';
export const LEGIT_SOFT = 'rgba(62,119,82,0.10)';
export const GOLD = '#C98A1B';
export const GOLD_SOFT = 'rgba(201,138,27,0.14)';
export const PAPER_ON_INK = '#F7F0E4';

/**
 * Accessible small-text tokens. Use ONLY as the color of actual text under
 * 19px (MONO micro labels, captions, source lines, small helper text, and
 * gold text on GOLD_SOFT pills). The brand fills stay untouched: keep
 * INK_FAINT / GOLD for fills, borders, hairlines, icon strokes, rings,
 * progress tracks, and any display text >=19px (which already clears the
 * large-text threshold). These clear WCAG AA (>=4.5:1) over SURFACE, PAPER,
 * and GOLD_SOFT-on-paper.
 *   INK_MICRO  on SURFACE 4.76 / on PAPER 4.63
 *   GOLD_TEXT  on SURFACE 5.60 / on PAPER 5.20 / on GOLD_SOFT 4.90 (S) 4.58 (P)
 */
export const INK_MICRO = 'rgba(34,27,22,0.62)';
export const GOLD_TEXT = '#8A5E0F';

/** identity border for tactile elements; hairlines stay for quiet dividers */
export const BORDER_INK = `1.5px solid ${INK}`;
/** gold foil gradient for the primary CTA */
export const GOLD_GRAD = 'linear-gradient(180deg, #EDB248 0%, #D19022 58%, #B67A10 100%)';
/** ink gradient for dark tactile surfaces */
export const INK_GRAD = 'linear-gradient(180deg, #33291F 0%, #221B16 70%)';

// ---------- type ----------
export const DISPLAY = { fontFamily: "'Bricolage Grotesque Variable', sans-serif" } as const;
export const BODY = { fontFamily: "'Inter Variable', sans-serif" } as const;
export const MONO = { fontFamily: "'JetBrains Mono Variable', monospace" } as const;
/** italic serif accent, used sparingly for editorial flavor lines */
export const SERIF = { fontFamily: "'Fraunces Variable', serif", fontStyle: 'italic' } as const;

// ---------- elevation ----------
// Soft shadows for quiet, non-interactive surfaces.
export const SHADOW_SM = '0 1px 2px rgba(34,27,22,0.05), 0 2px 8px rgba(34,27,22,0.06)';
export const SHADOW_MD = '0 2px 4px rgba(34,27,22,0.05), 0 12px 28px rgba(34,27,22,0.10)';
export const SHADOW_LG = '0 4px 8px rgba(34,27,22,0.06), 0 20px 48px rgba(34,27,22,0.14)';

// Premium static stack for hero cards: hard offset (identity) + ambient
// depth + inner top highlight, so panels read as physical, lit objects.
export const PREMIUM_CARD =
  '0 4px 0 rgba(34,27,22,1), 0 18px 40px rgba(34,27,22,0.12), inset 0 1.5px 0 rgba(255,255,255,0.8)';
export const PREMIUM_CARD_SM =
  '0 3px 0 rgba(34,27,22,1), 0 10px 22px rgba(34,27,22,0.09), inset 0 1px 0 rgba(255,255,255,0.7)';

// Tactile press states (equal layer counts so the shadow interpolates).
const TACTILE = {
  md: {
    sink: 3,
    rest: '0 3px 0 rgba(34,27,22,1), 0 10px 22px rgba(34,27,22,0.10), inset 0 1px 0 rgba(255,255,255,0.65)',
    lift: '0 4px 0 rgba(34,27,22,1), 0 14px 28px rgba(34,27,22,0.14), inset 0 1px 0 rgba(255,255,255,0.65)',
    sunk: '0 0px 0 rgba(34,27,22,1), 0 3px 8px rgba(34,27,22,0.05), inset 0 1px 0 rgba(255,255,255,0.4)',
  },
  lg: {
    sink: 4,
    rest: '0 4px 0 rgba(34,27,22,1), 0 16px 34px rgba(34,27,22,0.13), inset 0 1.5px 0 rgba(255,255,255,0.7)',
    lift: '0 5px 0 rgba(34,27,22,1), 0 20px 40px rgba(34,27,22,0.17), inset 0 1.5px 0 rgba(255,255,255,0.7)',
    sunk: '0 0px 0 rgba(34,27,22,1), 0 4px 10px rgba(34,27,22,0.05), inset 0 1.5px 0 rgba(255,255,255,0.45)',
  },
} as const;

// ---------- motion ----------
export const SPRING_SNAP = { type: 'spring', stiffness: 500, damping: 30 } as const;
export const SPRING_CARD = { type: 'spring', stiffness: 380, damping: 32, mass: 0.9 } as const;
export const SPRING_GENTLE = { type: 'spring', stiffness: 260, damping: 28 } as const;
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const PRESS_TWEEN = { type: 'tween', duration: 0.1, ease: 'easeOut' } as const;

// ---------- primitives ----------

type PressableProps = HTMLMotionProps<'button'> & {
  children?: ReactNode;
  /** press compression for non-tactile buttons; large CTAs read better at 0.98 */
  pressScale?: number;
  /** silence the built-in press tick (e.g. when the caller owns audio) */
  quiet?: boolean;
  /**
   * physical press: the button sits on a hard shadow and sinks onto it when
   * pressed. Caller must give the button an ink border (BORDER_INK) and an
   * opaque background. 'lg' for the primary CTA.
   */
  tactile?: boolean | 'lg';
};

/**
 * The one press feel used everywhere. Tactile buttons compress onto their
 * hard shadow like a physical key; quiet buttons scale 0.97. Audio tick on
 * pointerdown so the confirmation lands before the visual settles.
 */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  function Pressable({ children, pressScale = 0.97, quiet = false, tactile = false, disabled, onPointerDown, style, className, ...rest }, ref) {
    const handleDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!disabled && e.isPrimary && e.button === 0) {
        sound.unlock();
        if (!quiet) {
          sound.play('press');
          sound.buzz(8);
        }
      }
      onPointerDown?.(e as never);
    };

    if (tactile) {
      const t = TACTILE[tactile === 'lg' ? 'lg' : 'md'];
      return (
        <motion.button
          ref={ref}
          disabled={disabled}
          initial={false}
          animate={{ y: 0, boxShadow: t.rest }}
          whileHover={disabled ? undefined : { y: -1, boxShadow: t.lift }}
          whileTap={disabled ? undefined : { y: t.sink, boxShadow: t.sunk }}
          transition={PRESS_TWEEN}
          className={`fiq-ring ${className ?? ''}`}
          style={style as CSSProperties}
          onPointerDown={handleDown}
          {...rest}
        >
          {children}
        </motion.button>
      );
    }

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: pressScale }}
        transition={SPRING_SNAP}
        className={`fiq-ring ${className ?? ''}`}
        style={style as CSSProperties}
        onPointerDown={handleDown}
        {...rest}
      >
        {children}
      </motion.button>
    );
  },
);
