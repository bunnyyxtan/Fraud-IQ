import { GOLD, INK, PAPER_ON_INK } from '@/lib/ui';

/**
 * Fraud IQ brand mark: rounded ink tile, geometric F knockout, gold period.
 * Scales cleanly; pass `size` in px.
 */
export function BrandMark({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      role="img"
      aria-label="Fraud IQ logo"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="140" height="140" rx="34" fill={INK} />
      <g fill={PAPER_ON_INK}>
        <rect x="42" y="32" width="20" height="76" rx="3" />
        <rect x="42" y="32" width="56" height="18" rx="3" />
        <rect x="42" y="66" width="44" height="16" rx="3" />
      </g>
      <circle cx="98" cy="100" r="9" fill={GOLD} />
    </svg>
  );
}
