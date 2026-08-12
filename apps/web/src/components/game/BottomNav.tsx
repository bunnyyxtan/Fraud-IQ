import { Pressable, SURFACE, INK, INK_MICRO, GOLD, GOLD_GRAD, BORDER_INK, PREMIUM_CARD_SM, MONO } from '@/lib/ui';

export type NavTab = 'leaderboard' | 'play' | 'profile';

const TrophyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 3M17 6h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 3" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/** sharp equilateral triangle; crisp corners read more professional than the old rounded blob */
const PlayIcon = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8.4 5.2 19 12 8.4 18.8V5.2z" />
  </svg>
);

function Tab({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Pressable
      quiet
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className="flex-1 flex flex-col items-center justify-center gap-[3px] rounded-2xl"
      style={{ color: isActive ? INK : INK_MICRO }}
    >
      {icon}
      <span className="text-[9px] uppercase tracking-[0.14em] font-semibold" style={MONO}>{label}</span>
      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: isActive ? GOLD : 'transparent' }} aria-hidden="true" />
    </Pressable>
  );
}

/**
 * App-style bottom navigation for the menu surfaces (start, ranks, profile).
 * Hidden during runs; the center gold key returns to the play hub.
 */
export function BottomNav({ active, onNavigate }: { active: NavTab; onNavigate: (tab: NavTab) => void }) {
  return (
    <nav aria-label="Main" className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      <div className="max-w-[440px] mx-auto px-6" style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}>
        <div
          className="pointer-events-auto relative flex items-stretch rounded-[26px] px-3 h-[66px]"
          style={{ backgroundColor: SURFACE, border: BORDER_INK, boxShadow: PREMIUM_CARD_SM }}
        >
          <Tab
            label="Ranks"
            icon={<TrophyIcon />}
            isActive={active === 'leaderboard'}
            onClick={() => onNavigate('leaderboard')}
          />
          <div className="w-[80px] flex justify-center shrink-0">
            <div className="-mt-[24px]">
              <Pressable
                tactile
                onClick={() => onNavigate('play')}
                aria-label="Play"
                aria-current={active === 'play' ? 'page' : undefined}
                className="relative w-[64px] h-[64px] rounded-full flex items-center justify-center"
                style={{ background: GOLD_GRAD, border: BORDER_INK, color: INK }}
              >
                {/* machined bezel ring: catches light on top, shades at the base */}
                <span
                  aria-hidden="true"
                  className="absolute inset-[4px] rounded-full pointer-events-none"
                  style={{ border: '1px solid rgba(255,252,240,0.5)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -2px 3px rgba(120,70,10,0.3)' }}
                />
                <span className="ml-[2px] flex relative"><PlayIcon /></span>
              </Pressable>
            </div>
          </div>
          <Tab
            label="Profile"
            icon={<UserIcon />}
            isActive={active === 'profile'}
            onClick={() => onNavigate('profile')}
          />
        </div>
      </div>
    </nav>
  );
}
