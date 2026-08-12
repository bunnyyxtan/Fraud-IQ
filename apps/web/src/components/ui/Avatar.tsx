import type { ReactElement } from 'react';
import { INK, PAPER, GOLD } from '@/lib/ui';

/**
 * Fraud IQ avatar set: 12 hand-drawn geometric characters in the brand
 * palette. IDs are shared verbatim with the API server's allowlist.
 * Players who never pick get a deterministic one from their playerId;
 * guests get the incognito tipster until they choose.
 */
export const AVATAR_IDS = [
  'fox', 'cat', 'owl', 'robot', 'detective', 'ghost',
  'alien', 'shark', 'snake', 'bunny', 'skull', 'incognito',
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export const AVATAR_LABELS: Record<AvatarId, string> = {
  fox: 'The Fox',
  cat: 'Monocle Cat',
  owl: 'Night Owl',
  robot: 'The Bot',
  detective: 'The Detective',
  ghost: 'Ghosted',
  alien: 'Off Grid',
  shark: 'Loan Shark',
  snake: 'Smooth Talker',
  bunny: 'The Bunny',
  skull: 'No Cap',
  incognito: 'Anonymous Tip',
};

/* All faces live on a 48x48 grid inside a 2px ink ring. */
const AVATARS: Record<AvatarId, { bg: string; art: ReactElement }> = {
  fox: {
    bg: '#F2D5B2',
    art: (
      <g>
        <path d="M13 20 L10 7 L21 13 Z" fill="#DE8A3C" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M35 20 L38 7 L27 13 Z" fill="#DE8A3C" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="24" cy="26" r="13" fill="#E89B4B" stroke={INK} strokeWidth="2" />
        <path d="M24 27 L19 33 Q24 37 29 33 Z" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="24" cy="34" r="2" fill={INK} />
        <circle cx="18.5" cy="24" r="1.8" fill={INK} />
        <circle cx="29.5" cy="24" r="1.8" fill={INK} />
      </g>
    ),
  },
  cat: {
    bg: '#E4DCD2',
    art: (
      <g>
        <path d="M13 19 L11 8 L20 13 Z" fill="#9A8F81" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M35 19 L37 8 L28 13 Z" fill="#9A8F81" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="24" cy="26" r="13" fill="#B4A898" stroke={INK} strokeWidth="2" />
        <circle cx="30" cy="24" r="5.5" fill="none" stroke={GOLD} strokeWidth="2" />
        <line x1="34" y1="28" x2="36.5" y2="32" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="24" r="1.8" fill={INK} />
        <circle cx="30" cy="24" r="1.8" fill={INK} />
        <path d="M22 31 L24 33 L26 31" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="8" y1="27" x2="14" y2="28" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="40" y1="27" x2="34" y2="28" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    ),
  },
  owl: {
    bg: '#D9CDBB',
    art: (
      <g>
        <path d="M12 14 Q24 8 36 14 L34 34 Q24 40 14 34 Z" fill="#8C6F4E" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="18.5" cy="23" r="6" fill={PAPER} stroke={INK} strokeWidth="2" />
        <circle cx="29.5" cy="23" r="6" fill={PAPER} stroke={INK} strokeWidth="2" />
        <circle cx="18.5" cy="23" r="2.2" fill={INK} />
        <circle cx="29.5" cy="23" r="2.2" fill={INK} />
        <path d="M24 28 L21.5 32 L26.5 32 Z" fill={GOLD} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    ),
  },
  robot: {
    bg: '#CBD5D2',
    art: (
      <g>
        <line x1="24" y1="8" x2="24" y2="13" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="7" r="2.2" fill={GOLD} stroke={INK} strokeWidth="1.5" />
        <rect x="12" y="13" width="24" height="22" rx="6" fill="#8FA6A0" stroke={INK} strokeWidth="2" />
        <rect x="17" y="20" width="5" height="6" rx="1.5" fill={PAPER} stroke={INK} strokeWidth="1.5" />
        <rect x="26" y="20" width="5" height="6" rx="1.5" fill={PAPER} stroke={INK} strokeWidth="1.5" />
        <line x1="19" y1="31" x2="29" y2="31" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2.5" />
      </g>
    ),
  },
  detective: {
    bg: '#EAD9B8',
    art: (
      <g>
        <circle cx="24" cy="27" r="12" fill="#E5C089" stroke={INK} strokeWidth="2" />
        <path d="M11 18 Q24 10 37 18 L37 20 L11 20 Z" fill={INK} />
        <path d="M15 18 Q15 11 24 11 Q33 11 33 18 Z" fill={INK} />
        <circle cx="19" cy="26" r="1.8" fill={INK} />
        <circle cx="29" cy="26" r="1.8" fill={INK} />
        <circle cx="31" cy="33" r="5" fill="none" stroke={GOLD} strokeWidth="2.2" />
        <line x1="27.5" y1="29.5" x2="24.5" y2="26.5" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    ),
  },
  ghost: {
    bg: '#E9E2D6',
    art: (
      <g>
        <path d="M13 24 Q13 11 24 11 Q35 11 35 24 L35 36 L31 33 L27.5 36 L24 33 L20.5 36 L17 33 L13 36 Z" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx="19.5" cy="22" rx="1.8" ry="2.6" fill={INK} />
        <ellipse cx="28.5" cy="22" rx="1.8" ry="2.6" fill={INK} />
        <ellipse cx="24" cy="28.5" rx="2" ry="1.4" fill="none" stroke={INK} strokeWidth="1.5" />
      </g>
    ),
  },
  alien: {
    bg: '#D3DDC3',
    art: (
      <g>
        <path d="M24 10 Q37 10 37 22 Q37 31 30 36 Q24 40 18 36 Q11 31 11 22 Q11 10 24 10 Z" fill="#9BB07E" stroke={INK} strokeWidth="2" />
        <path d="M15 22 Q18 19 21 23 Q19 27 15 25 Q14 23.5 15 22 Z" fill={INK} />
        <path d="M33 22 Q30 19 27 23 Q29 27 33 25 Q34 23.5 33 22 Z" fill={INK} />
        <line x1="22" y1="32" x2="26" y2="32" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
  },
  shark: {
    bg: '#C7D3DA',
    art: (
      <g>
        <path d="M24 6 L28 14 L20 14 Z" fill="#7E99A8" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="24" cy="27" r="13" fill="#8FA9B8" stroke={INK} strokeWidth="2" />
        <circle cx="18.5" cy="24" r="1.8" fill={INK} />
        <circle cx="29.5" cy="24" r="1.8" fill={INK} />
        <path d="M16 31 L20 31 L22 34 L24 31 L26 34 L28 31 L32 31" fill={PAPER} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      </g>
    ),
  },
  snake: {
    bg: '#D6D8B4',
    art: (
      <g>
        <circle cx="24" cy="25" r="13" fill="#A9AD62" stroke={INK} strokeWidth="2" />
        <path d="M17 20 Q20 17 23 20" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <path d="M25 20 Q28 17 31 20" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="23" r="1.8" fill={INK} />
        <circle cx="28" cy="23" r="1.8" fill={INK} />
        <path d="M24 31 L24 38 M24 38 L21.5 41 M24 38 L26.5 41" fill="none" stroke="#C44536" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 30 Q24 33 28 30" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
  },
  bunny: {
    bg: '#EFD8D2',
    art: (
      <g>
        <ellipse cx="18" cy="12" rx="4" ry="9" fill={PAPER} stroke={INK} strokeWidth="2" />
        <ellipse cx="30" cy="12" rx="4" ry="9" fill={PAPER} stroke={INK} strokeWidth="2" />
        <circle cx="24" cy="28" r="12" fill="#E8B7AC" stroke={INK} strokeWidth="2" />
        <circle cx="19" cy="26" r="1.8" fill={INK} />
        <circle cx="29" cy="26" r="1.8" fill={INK} />
        <rect x="21" y="31" width="6" height="5" rx="1" fill={PAPER} stroke={INK} strokeWidth="1.5" />
        <line x1="24" y1="31" x2="24" y2="36" stroke={INK} strokeWidth="1.5" />
      </g>
    ),
  },
  skull: {
    bg: '#DBD7CE',
    art: (
      <g>
        <path d="M24 9 Q36 9 36 21 Q36 28 31 30 L31 36 Q31 38 29 38 L19 38 Q17 38 17 36 L17 30 Q12 28 12 21 Q12 9 24 9 Z" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="18.5" cy="21" r="3.4" fill={INK} />
        <circle cx="29.5" cy="21" r="3.4" fill={INK} />
        <path d="M24 25 L22 29 L26 29 Z" fill={INK} />
        <line x1="21" y1="33" x2="21" y2="37" stroke={INK} strokeWidth="1.5" />
        <line x1="24" y1="33" x2="24" y2="37" stroke={INK} strokeWidth="1.5" />
        <line x1="27" y1="33" x2="27" y2="37" stroke={INK} strokeWidth="1.5" />
      </g>
    ),
  },
  incognito: {
    bg: '#3A322B',
    art: (
      <g>
        <path d="M12 38 Q12 20 24 12 Q36 20 36 38 Z" fill={INK} stroke="#584C41" strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx="24" cy="27" rx="7.5" ry="8.5" fill="#171310" />
        <circle cx="21" cy="26" r="1.8" fill={PAPER} />
        <circle cx="27" cy="26" r="1.8" fill={PAPER} />
      </g>
    ),
  },
};

const PICK_POOL = AVATAR_IDS.filter((a) => a !== 'incognito');

function isAvatarId(v: unknown): v is AvatarId {
  return typeof v === 'string' && (AVATAR_IDS as readonly string[]).includes(v);
}

/**
 * Resolve which face to show. Explicit choice wins; signed players fall back
 * to a stable pick from their playerId (so everyone sees the same face);
 * guests fall back to their local pick, else the incognito tipster.
 */
export function avatarFor(
  p: { id?: number | null; avatar?: string | null } | null | undefined,
  guestPick?: string | null,
): AvatarId {
  if (p && isAvatarId(p.avatar)) return p.avatar;
  if (p && typeof p.id === 'number' && Number.isFinite(p.id)) {
    return PICK_POOL[Math.abs(Math.trunc(p.id)) % PICK_POOL.length];
  }
  if (isAvatarId(guestPick)) return guestPick;
  return 'incognito';
}

export function Avatar({ id, size = 48, className }: { id: AvatarId; size?: number; className?: string }) {
  const a = AVATARS[id];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} role="img" aria-label={AVATAR_LABELS[id]}>
      <circle cx="24" cy="24" r="23" fill={a.bg} stroke={INK} strokeWidth="2" />
      {a.art}
    </svg>
  );
}
