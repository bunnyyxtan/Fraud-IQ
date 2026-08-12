import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LeaderboardResponse, LeaderboardEntry, MeResponse, fetchLeaderboard, fetchMe } from '@/lib/api';
import { PlayerProfile } from '@/lib/game';
import { Avatar, avatarFor } from '@/components/ui/Avatar';
import {
  BODY, DISPLAY, MONO,
  PAPER, INK, INK_SOFT, INK_FAINT, INK_MICRO, HAIRLINE, SURFACE, PAPER_ON_INK,
  GOLD, GOLD_SOFT, GOLD_GRAD,
  BORDER_INK, PREMIUM_CARD_SM,
  SHADOW_SM, SHADOW_MD,
  SPRING_SNAP, EASE_OUT,
  Pressable,
} from '@/lib/ui';

type BoardScope = 'alltime' | 'today';

const MEDAL_COLORS: Record<number, string> = {
  1: GOLD,
  2: '#9A8D7E',
  3: '#B0653F',
};

function Medal({ rank }: { rank: number }) {
  const bg = MEDAL_COLORS[rank];
  if (bg) {
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: bg, color: SURFACE, boxShadow: SHADOW_SM }}
      >
        <span className="text-[16px] tabular-nums" style={{ ...DISPLAY, fontWeight: 700 }}>{rank}</span>
      </div>
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, color: INK_SOFT }}
    >
      <span className="text-[15px] tabular-nums" style={{ ...DISPLAY, fontWeight: 700 }}>{rank}</span>
    </div>
  );
}

function Crown() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="mb-1">
      <path
        d="M4 8.2l4.3 3.6L12 5.2l3.7 6.6L20 8.2V16a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16V8.2z"
        fill={GOLD}
        stroke={INK}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** One podium slot. `place` drives size and medal color; the shown number is the true rank. */
function PodiumCard({
  entry,
  place,
  isMe,
  reduced,
  delay,
}: {
  entry: LeaderboardEntry;
  place: 1 | 2 | 3;
  isMe: boolean;
  reduced: boolean;
  delay: number;
}) {
  const first = place === 1;
  const ring = MEDAL_COLORS[place];
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE_OUT }}
      className={`relative flex flex-col items-center rounded-2xl px-2 pb-3.5 min-w-0 ${first ? 'pt-3' : 'pt-4 mt-7'}`}
      style={{
        backgroundColor: SURFACE,
        border: isMe ? `1.5px solid ${GOLD}` : BORDER_INK,
        boxShadow: PREMIUM_CARD_SM,
      }}
    >
      {isMe && (
        <div
          className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[8.5px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...MONO, backgroundColor: GOLD, color: SURFACE, boxShadow: SHADOW_SM }}
        >
          You
        </div>
      )}

      {first && <Crown />}

      <div className="relative">
        <div className="rounded-full" style={{ border: `2.5px solid ${ring}`, lineHeight: 0 }}>
          <Avatar id={avatarFor({ id: entry.playerId, avatar: entry.avatar })} size={first ? 49 : 39} />
        </div>
        <div
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
          style={{
            background: first ? GOLD_GRAD : ring,
            border: `1.5px solid ${INK}`,
          }}
        >
          <span className="text-[10px] leading-none tabular-nums" style={{ ...DISPLAY, fontWeight: 800, color: first ? INK : SURFACE }}>
            {entry.rank}
          </span>
        </div>
      </div>

      <div className="mt-3 w-full text-center text-[12.5px] font-semibold leading-tight truncate">{entry.name}</div>
      <div
        className="mt-1 w-full text-center text-[8px] font-medium uppercase tracking-[0.12em] truncate"
        style={{ ...MONO, color: INK_MICRO }}
      >
        {entry.levelTitle}
      </div>
      <div className={`mt-1.5 tabular-nums leading-none ${first ? 'text-[22px]' : 'text-[17px]'}`} style={{ ...DISPLAY, fontWeight: 800 }}>
        {entry.bestScore}
      </div>
    </motion.div>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="rounded-full px-4 py-1.5 flex items-baseline gap-1.5"
      style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}` }}
    >
      <span className="text-[14px] tabular-nums" style={{ ...DISPLAY, fontWeight: 700 }}>{value}</span>
      <span className="text-[9px] uppercase font-medium tracking-[0.14em]" style={{ ...MONO, color: INK_MICRO }}>{label}</span>
    </div>
  );
}

export function LeaderboardScreen({ profile }: { profile: PlayerProfile | null }) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scope, setScope] = useState<BoardScope>('alltime');
  const [me, setMe] = useState<MeResponse | null>(null);
  const reduced = useReducedMotion() ?? false;

  const load = (s: BoardScope) => {
    setLoading(true);
    setError(false);
    fetchLeaderboard(50, s)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    load(scope);
  }, [scope]);

  // Own standing for the pinned footer; a failure just means no pin.
  useEffect(() => {
    if (!profile) {
      setMe(null);
      return;
    }
    let cancelled = false;
    fetchMe(profile)
      .then(r => {
        if (!cancelled) setMe(r);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const entries = data?.entries ?? [];
  const hasPodium = entries.length >= 3;
  const podium = hasPodium ? entries.slice(0, 3) : [];
  const listEntries = hasPodium ? entries.slice(3) : entries;
  const onBoard = Boolean(profile && entries.some(e => e.playerId === profile.id));
  const isMeId = (id: number) => Boolean(profile && id === profile.id);

  return (
    <main
      className="flex flex-col h-[100dvh] max-w-[440px] mx-auto w-full px-6 pt-10 pb-32"
      style={{ ...BODY, backgroundColor: PAPER, color: INK }}
    >
      <style>{`
        .lb-hide-scrollbar::-webkit-scrollbar { display: none; }
        .lb-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-center mb-6 shrink-0">
        <h1 className="text-[24px] m-0" style={{ ...DISPLAY, fontWeight: 800 }}>Ranks</h1>
      </div>

      {/* Scope toggle */}
      <div
        className="rounded-full p-1 flex relative mb-6 shrink-0"
        role="radiogroup"
        aria-label="Leaderboard scope"
        style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_SM }}
      >
        {(['alltime', 'today'] as const).map((s) => {
          const active = scope === s;
          return (
            <button
              key={s}
              role="radio"
              aria-checked={active}
              onClick={() => setScope(s)}
              className="fiq-ring flex-1 relative rounded-full py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors"
              style={{ ...MONO, color: active ? PAPER_ON_INK : INK_MICRO }}
            >
              {active && (
                <motion.div
                  layoutId="lb-scope-thumb"
                  transition={SPRING_SNAP}
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: INK, boxShadow: SHADOW_SM }}
                />
              )}
              <span className="relative z-10">{s === 'alltime' ? 'All time' : 'Today'}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col gap-3"
            >
              <div className="grid grid-cols-3 gap-2.5">
                <div className="h-[122px] mt-7 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(34,27,22,0.06)' }}></div>
                <div className="h-[150px] rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(34,27,22,0.08)' }}></div>
                <div className="h-[122px] mt-7 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(34,27,22,0.06)' }}></div>
              </div>
              <div className="h-16 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(34,27,22,0.06)' }}></div>
              <div className="flex-1 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(34,27,22,0.045)' }}></div>
            </motion.div>
          )}

          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 rounded-[24px]"
              style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_MD }}
            >
              <div className="text-[18px] mb-6" style={{ ...DISPLAY, fontWeight: 700 }}>Could not load leaderboard</div>
              <Pressable
                pressScale={0.98}
                onClick={() => load(scope)}
                className="rounded-2xl px-8 py-3.5"
                style={{ backgroundColor: INK, boxShadow: SHADOW_MD }}
              >
                <span className="text-[15px] uppercase tracking-[0.08em]" style={{ ...DISPLAY, fontWeight: 700, color: PAPER_ON_INK }}>Retry</span>
              </Pressable>
            </motion.div>
          )}

          {data && !loading && entries.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 rounded-[24px]"
              style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_MD }}
            >
              <div className="text-[20px] mb-2" style={{ ...DISPLAY, fontWeight: 700 }}>
                {scope === 'today' ? "Today's ledger is blank" : 'Nobody on the board yet'}
              </div>
              <div className="text-[13px] font-medium" style={{ color: INK_SOFT }}>
                {scope === 'today' ? 'Any run today counts. Resets midnight ET.' : 'Be the first to sign the ledger.'}
              </div>
            </motion.div>
          )}

          {data && !loading && entries.length > 0 && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Community pulse; personal numbers live in Profile */}
              <div className="flex justify-center gap-2.5 mb-5 shrink-0">
                <StatChip
                  value={String(data.stats.totalPlayers)}
                  label={data.stats.totalPlayers === 1 ? 'analyst' : 'analysts'}
                />
                <StatChip
                  value={String(data.stats.totalRuns)}
                  label={data.stats.totalRuns === 1 ? 'run logged' : 'runs logged'}
                />
              </div>

              <div className="flex-1 overflow-y-auto lb-hide-scrollbar px-1 pt-1 pb-2">
                {/* Podium: 2 | 1 | 3, center elevated */}
                {hasPodium && (
                  <div className="grid grid-cols-3 gap-2.5 items-start mb-4">
                    <PodiumCard entry={podium[1]} place={2} isMe={isMeId(podium[1].playerId)} reduced={reduced} delay={0.06} />
                    <PodiumCard entry={podium[0]} place={1} isMe={isMeId(podium[0].playerId)} reduced={reduced} delay={0} />
                    <PodiumCard entry={podium[2]} place={3} isMe={isMeId(podium[2].playerId)} reduced={reduced} delay={0.12} />
                  </div>
                )}

                {/* The rest of the ledger */}
                <div className="flex flex-col gap-3">
                  {listEntries.map((entry, i) => {
                    const isMe = isMeId(entry.playerId);
                    return (
                      <motion.div
                        key={entry.playerId}
                        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 + i * 0.035, ease: EASE_OUT }}
                        className="relative flex items-center gap-3.5 p-4 rounded-2xl"
                        style={
                          isMe
                            ? { backgroundColor: GOLD_SOFT, border: `1.5px solid ${GOLD}`, boxShadow: SHADOW_MD }
                            : { backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_SM }
                        }
                      >
                        {isMe && (
                          <div
                            className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-[0.16em]"
                            style={{ ...MONO, backgroundColor: GOLD, color: SURFACE, boxShadow: SHADOW_SM }}
                          >
                            You
                          </div>
                        )}

                        <Medal rank={entry.rank} />

                        <Avatar id={avatarFor({ id: entry.playerId, avatar: entry.avatar })} size={34} className="shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-semibold leading-none truncate">{entry.name}</div>
                          <div className="text-[10px] font-medium uppercase tracking-[0.12em] mt-1.5 truncate" style={{ ...MONO, color: INK_MICRO }}>
                            {entry.levelTitle}
                          </div>
                        </div>

                        <div className="text-[22px] pr-1 tabular-nums" style={{ ...DISPLAY, fontWeight: 700 }}>
                          {entry.bestScore}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Your standing, pinned when you are not visible above */}
              {profile && !onBoard && scope === 'alltime' && me && me.rank != null && (
                <motion.div
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2, ease: EASE_OUT }}
                  className="relative shrink-0 mt-3 flex items-center gap-3.5 p-4 rounded-2xl"
                  style={{ backgroundColor: GOLD_SOFT, border: `1.5px solid ${GOLD}`, boxShadow: SHADOW_MD }}
                >
                  <Avatar id={avatarFor({ id: profile.id, avatar: me.avatar })} size={40} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold leading-none truncate">{me.name}</div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] mt-1.5" style={{ ...MONO, color: INK_MICRO }}>
                      #{me.rank} · Your standing
                    </div>
                  </div>
                  <div className="text-[22px] pr-1 tabular-nums" style={{ ...DISPLAY, fontWeight: 700 }}>
                    {me.bestScore}
                  </div>
                </motion.div>
              )}

              {profile && !onBoard && scope === 'today' && (
                <div
                  className="shrink-0 mt-3 text-center text-[10px] font-medium uppercase tracking-[0.16em]"
                  style={{ ...MONO, color: INK_MICRO }}
                >
                  No signature on today's ledger yet
                </div>
              )}

              {!profile && (
                <div
                  className="shrink-0 mt-3 text-center text-[10px] font-medium uppercase tracking-[0.16em]"
                  style={{ ...MONO, color: INK_MICRO }}
                >
                  Finish a run and sign it to enter the ledger
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
