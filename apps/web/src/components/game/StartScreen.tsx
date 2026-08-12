import { useEffect, useRef, useState } from 'react';
import { Stats, formatMoney, PlayerProfile, Country, COUNTRY_META, poolStats, loadDailyRecord, dailyDateKey, formatDailyDate, deckBand, levelTitle } from '@/lib/game';
import { INTEL_STATS } from '@/data/intel';
import { sound } from '@/lib/sound';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  BODY, DISPLAY, MONO, SERIF,
  INK, INK_SOFT, INK_FAINT, INK_MICRO, HAIRLINE, SURFACE, PAPER_ON_INK,
  GOLD, GOLD_TEXT, GOLD_SOFT, LEGIT, SCAM, SCAM_SOFT, LEGIT_SOFT,
  BORDER_INK, GOLD_GRAD,
  SHADOW_SM, PREMIUM_CARD_SM,
  SPRING_SNAP, SPRING_CARD, EASE_OUT,
  Pressable,
} from '@/lib/ui';
import { BrandMark } from '@/components/ui/BrandMark';
import { Avatar, avatarFor } from '@/components/ui/Avatar';

const ArrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

const BoltIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const MusicIcon = ({ off = false }: { off?: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
    {off && <line x1="3" y1="3" x2="21" y2="21" />}
  </svg>
);

/**
 * Live intercept teaser: real message snippets (modeled on actual deck
 * cards) slide in, get stamped SCAM or LEGIT, and cycle. The landing page
 * demos the game before the first tap.
 */
interface Teaser {
  kind: string;
  from: string;
  line: string;
  verdict: 'scam' | 'legit';
}

const TEASERS: Record<Country, Teaser[]> = {
  us: [
    { kind: 'SMS', from: '+1 (938) 209-4415', line: 'USPS: your package is on hold. Pay the $1.99 redelivery fee now', verdict: 'scam' },
    { kind: 'EMAIL', from: 'Spotify', line: 'Your receipt for Premium Individual, $11.99', verdict: 'legit' },
    { kind: 'CALL', from: 'Unknown caller', line: '"This is the IRS. Settle today with gift cards or face arrest."', verdict: 'scam' },
  ],
  in: [
    { kind: 'SMS', from: 'VM-KYCUPD', line: 'Dear customer, your bank KYC expires TODAY. Update via link', verdict: 'scam' },
    { kind: 'SMS', from: 'AX-HDFCBK', line: 'INR 4,500 credited to a/c XX3921. Avl bal INR 18,240', verdict: 'legit' },
    { kind: 'CALL', from: '+91 74309 88123', line: '"CBI officer speaking. You are under digital arrest."', verdict: 'scam' },
  ],
};

const STAMP_AT_MS = 1700;
const ADVANCE_AT_MS = 3600;

function LiveFeed({ country, reduced }: { country: Country; reduced: boolean }) {
  const items = TEASERS[country];
  const [idx, setIdx] = useState(0);
  const [stamped, setStamped] = useState(reduced);

  // Reset the loop when the region flips so the feed always matches.
  useEffect(() => {
    setIdx(0);
    setStamped(reduced);
  }, [country, reduced]);

  useEffect(() => {
    if (reduced) return;
    setStamped(false);
    const stampT = setTimeout(() => setStamped(true), STAMP_AT_MS);
    const nextT = setTimeout(() => setIdx((i) => (i + 1) % items.length), ADVANCE_AT_MS);
    return () => {
      clearTimeout(stampT);
      clearTimeout(nextT);
    };
  }, [idx, items.length, reduced, country]);

  const t = items[idx];
  const verdictColor = t.verdict === 'scam' ? SCAM : LEGIT;
  const verdictBg = t.verdict === 'scam' ? SCAM_SOFT : LEGIT_SOFT;

  return (
    <div
      className="w-full rounded-2xl px-4 pt-3 pb-3.5 overflow-hidden"
      style={{ backgroundColor: SURFACE, border: BORDER_INK, boxShadow: PREMIUM_CARD_SM }}
      aria-hidden="true"
    >
      <div className="flex items-center">
        <span className="text-[9.5px] font-medium tracking-[0.22em] uppercase" style={{ ...MONO, color: INK_MICRO }}>
          Live intercepts
        </span>
      </div>

      <div className="relative mt-2.5 h-[58px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${country}-${idx}`}
            initial={reduced ? { opacity: 0 } : { y: 22, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: -22, opacity: 0 }}
            transition={SPRING_CARD}
            className="absolute inset-0 flex items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="shrink-0 rounded-[5px] px-1.5 py-[2px] text-[8.5px] font-semibold tracking-[0.14em]"
                  style={{ ...MONO, border: `1px solid ${HAIRLINE}`, color: INK_MICRO }}
                >
                  {t.kind}
                </span>
                <span className="truncate text-[13px] font-bold">{t.from}</span>
              </div>
              <div className="mt-1 text-[12.5px] leading-snug font-medium line-clamp-2" style={{ color: INK_SOFT }}>
                {t.line}
              </div>
            </div>

            <div className="shrink-0 w-[74px] flex justify-end">
              {stamped && (
                <motion.span
                  initial={reduced ? { opacity: 0 } : { scale: 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 24 }}
                  className="rounded-[7px] px-2 py-1 text-[11px] font-extrabold tracking-[0.12em]"
                  style={{ ...MONO, color: verdictColor, backgroundColor: verdictBg, border: `2px solid ${verdictColor}` }}
                >
                  {t.verdict === 'scam' ? 'SCAM' : 'LEGIT'}
                </motion.span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Region-aware marquee of verified fraud stats, straight from the intel data. */
function StatTicker({ country }: { country: Country }) {
  const facts = INTEL_STATS.filter((s) => s.region === country).slice(0, 6);
  if (facts.length === 0) return null;
  const row = (keyPrefix: string) => (
    <span className="inline-flex items-center gap-6 pr-6">
      {facts.map((f) => (
        <span key={`${keyPrefix}-${f.id}`} className="inline-flex items-center gap-6 whitespace-nowrap">
          <span>
            <span style={{ color: INK }} className="font-bold">{f.stat}</span>
            <span className="ml-1.5">{f.headline}</span>
          </span>
          <span aria-hidden="true" style={{ color: GOLD }}>◆</span>
        </span>
      ))}
    </span>
  );
  return (
    <div
      className="w-full overflow-hidden py-2.5"
      style={{ borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}
      aria-hidden="true"
    >
      <div key={country} className="fiq-ticker inline-flex whitespace-nowrap text-[10px] uppercase tracking-[0.12em]" style={{ ...MONO, color: INK_MICRO }}>
        {row('a')}
        {row('b')}
      </div>
    </div>
  );
}

/**
 * Evidence Desk start screen, tactile edition. The landing is the demo:
 * a live intercept feed stamps real snippets SCAM or LEGIT above a gold
 * foil PLAY key that physically compresses, and a marquee of verified
 * fraud stats runs along the footer.
 */
export function StartScreen({
  stats,
  profile,
  country,
  playerLevel,
  onCountryChange,
  onStart,
  onStartDaily,
  onProfileChange
}: {
  stats: Stats,
  profile: PlayerProfile | null,
  country: Country,
  /** best-known level, drives the adaptive deck label under Play */
  playerLevel: number,
  onCountryChange: (c: Country) => void,
  onStart: () => void,
  onStartDaily: () => void,
  onProfileChange: (p: PlayerProfile | null) => void
}) {
  const daily = loadDailyRecord();
  const todayKey = dailyDateKey();
  const dailyDone = daily?.date === todayKey;
  const pool = poolStats(country);
  const reduced = useReducedMotion() ?? false;
  const [musicOn, setMusicOn] = useState(() => sound.musicIsOn());

  // Slide direction tracks which side of the segmented control was chosen.
  const prevCountry = useRef(country);
  const dir = country === prevCountry.current ? 0 : country === 'in' ? 1 : -1;
  useEffect(() => {
    prevCountry.current = country;
  }, [country]);

  const countries = Object.keys(COUNTRY_META) as Country[];

  return (
    <main
      className="relative flex flex-col min-h-[100dvh] w-full max-w-[440px] mx-auto px-6 pt-7 pb-28 overflow-hidden"
      style={{ ...BODY, color: INK }}
    >
      {/* Header: day streak (only once one exists) and best score */}
      <div className="w-full flex justify-between items-center gap-3">
        {stats.dayStreak > 0 ? (
          <div
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold tabular-nums"
            style={{ backgroundColor: SURFACE, border: BORDER_INK, boxShadow: SHADOW_SM }}
          >
            <span style={{ color: GOLD }}><BoltIcon /></span>
            Day streak {stats.dayStreak}
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <Pressable
            quiet
            onClick={() => setMusicOn(sound.toggleMusic())}
            aria-label={musicOn ? 'Turn music off' : 'Turn music on'}
            aria-pressed={musicOn}
            className="rounded-full w-10 h-10 flex items-center justify-center"
            style={{
              backgroundColor: SURFACE,
              border: BORDER_INK,
              boxShadow: SHADOW_SM,
              color: musicOn ? GOLD : INK_FAINT,
            }}
          >
            <MusicIcon off={!musicOn} />
          </Pressable>
          <div
            className="rounded-full px-4 py-1.5 text-[13px] font-semibold tabular-nums"
            style={{ backgroundColor: INK, color: PAPER_ON_INK, border: BORDER_INK, boxShadow: SHADOW_SM }}
          >
            Your best {stats.bestScore}
          </div>
        </div>
      </div>

      {/* Title */}
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="mt-8 flex flex-col items-start"
      >
        <BrandMark size={52} />
        <div className="mt-4 text-[10px] font-medium tracking-[0.22em] uppercase" style={{ ...MONO, color: INK_MICRO }}>
          Scam detection training
        </div>
        <h1
          className="mt-2.5 text-[58px] leading-[0.92] tracking-[-0.02em] m-0"
          style={{ ...DISPLAY, fontWeight: 800 }}
        >
          Fraud IQ
        </h1>
        <p className="mt-3 text-[18.5px] leading-snug m-0" style={{ ...SERIF, fontWeight: 500 }}>
          Real messages. Some are traps.
        </p>
      </motion.div>

      {/* Live intercept feed: the landing demos the game */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.06, ease: EASE_OUT }}
        className="mt-6"
      >
        <LiveFeed country={country} reduced={reduced} />
      </motion.div>

      {/* Primary and secondary actions */}
      <motion.div
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.12, ease: EASE_OUT }}
        className="w-full flex flex-col gap-3.5 mt-6"
      >
        <Pressable
          tactile="lg"
          onClick={() => {
            sound.unlock();
            onStart();
          }}
          className="w-full rounded-[18px] py-[18px] px-6 flex items-center justify-between"
          style={{ background: GOLD_GRAD, color: INK, border: BORDER_INK }}
        >
          <span className="text-[21px] uppercase tracking-[0.08em]" style={{ ...DISPLAY, fontWeight: 800 }}>
            Play
          </span>
          <ArrowIcon />
        </Pressable>

        {/* Adaptive deck: level identity plus an honest label of what it deals */}
        <div className="flex items-center justify-center gap-2 -mt-1">
          <span
            className="rounded-full px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] tabular-nums"
            style={{ ...MONO, backgroundColor: INK, color: PAPER_ON_INK }}
          >
            Lvl {playerLevel} · {levelTitle(playerLevel)}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em]" style={{ ...MONO, color: INK_MICRO }}>
            {deckBand(playerLevel)}
          </span>
        </div>

        <Pressable
          quiet={dailyDone}
          disabled={dailyDone}
          tactile={!dailyDone}
          onClick={() => {
            if (dailyDone) return;
            sound.unlock();
            onStartDaily();
          }}
          className="w-full rounded-[18px] px-5 py-4 text-left"
          style={{
            backgroundColor: SURFACE,
            border: dailyDone ? `1px solid ${HAIRLINE}` : BORDER_INK,
            opacity: dailyDone ? 0.75 : 1,
            cursor: dailyDone ? 'default' : undefined,
          }}
        >
          <span className="flex items-center justify-between gap-4">
            <span>
              <span className="block font-bold text-[15px] leading-none">Daily Gauntlet</span>
              <span className="block text-[12px] font-medium mt-1.5" style={{ color: INK_SOFT }}>
                {dailyDone
                  ? `Done today, ${daily?.score} pts, next case midnight ET`
                  : 'Same deck for everyone, one shot a day'}
              </span>
            </span>
            <span
              className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold tabular-nums"
              style={dailyDone
                ? { backgroundColor: 'rgba(34,27,22,0.06)', color: INK_MICRO }
                : { backgroundColor: GOLD_SOFT, color: GOLD_TEXT, border: `1px solid ${GOLD}` }}
            >
              {dailyDone ? 'Done' : formatDailyDate(todayKey)}
            </span>
          </span>
        </Pressable>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="flex flex-col items-center w-full"
      >
        {profile && (
          <div className="mt-6 text-[12px] font-medium flex items-center justify-center" style={{ color: INK_SOFT }}>
            <Avatar id={avatarFor(profile)} size={20} className="mr-2 shrink-0" />
            Playing as <span className="ml-1.5 font-bold" style={{ color: INK }}>{profile.name}</span>
            <Pressable
              onClick={() => onProfileChange(null)}
              className="ml-3 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, color: INK }}
            >
              Sign out
            </Pressable>
          </div>
        )}

        {/* Region: segmented control with a spring-loaded thumb */}
        <div className="mt-7 flex flex-col items-center">
          <div className="text-[10px] font-medium tracking-[0.22em] uppercase" style={{ ...MONO, color: INK_MICRO }}>
            Region
          </div>
          <div
            role="radiogroup"
            aria-label="Region"
            className="mt-3 inline-flex items-center p-1 rounded-full"
            style={{ backgroundColor: SURFACE, border: BORDER_INK, boxShadow: SHADOW_SM }}
          >
            {countries.map((c) => {
              const active = country === c;
              return (
                <motion.button
                  key={c}
                  role="radio"
                  aria-checked={active}
                  whileTap={{ scale: 0.97 }}
                  transition={SPRING_SNAP}
                  onPointerDown={(e) => {
                    if (!e.isPrimary || e.button !== 0 || active) return;
                    sound.unlock();
                    sound.play('press');
                    sound.buzz(8);
                  }}
                  onClick={() => {
                    sound.unlock();
                    if (!active) onCountryChange(c);
                  }}
                  className="fiq-ring relative rounded-full px-6 py-2 text-[13px] font-semibold"
                  style={{ color: active ? PAPER_ON_INK : INK_SOFT }}
                >
                  {active && (
                    <motion.span
                      layoutId="region-thumb"
                      transition={reduced ? { duration: 0 } : SPRING_SNAP}
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: INK, boxShadow: SHADOW_SM }}
                    />
                  )}
                  <span className="relative z-10">{COUNTRY_META[c].label}</span>
                </motion.button>
              );
            })}
          </div>
          <div className="mt-2.5 text-[10px] tracking-[0.14em] uppercase" style={{ ...MONO, color: INK_MICRO }}>
            more regions soon
          </div>
        </div>

        {/* Briefing card slides in from the side the region switch chose */}
        <div className="mt-5 w-full overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={country}
              initial={{ opacity: 0, x: reduced ? 0 : dir * 26 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : dir * -26 }}
              transition={SPRING_CARD}
              className="w-full rounded-2xl px-5 py-4 text-center"
              style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: SHADOW_SM }}
            >
              <div className="text-[13px] font-semibold">12 messages, 15 seconds each, 3 lives.</div>
              <div className="mt-1 text-[12px] font-medium tabular-nums" style={{ color: INK_SOFT }}>
                Pulled fresh from {pool.size} {COUNTRY_META[country].full} scenarios across {pool.categories} scam types.
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {stats.gamesPlayed > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-[12px]">
            <div
              className="rounded-full px-4 py-1.5 tabular-nums font-semibold pointer-events-none"
              style={{ backgroundColor: SURFACE, border: `1px solid ${HAIRLINE}`, color: INK_SOFT }}
            >
              Runs <span style={{ color: INK }}>{stats.gamesPlayed}</span>
            </div>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={country}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-full px-4 py-1.5 tabular-nums font-semibold pointer-events-none"
                style={{ backgroundColor: 'rgba(62,119,82,0.12)', color: LEGIT }}
              >
                Saved {formatMoney(stats.lifetimeSaved, country)}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Verified fraud stats, region-aware, straight from the intel data */}
        <div className="mt-6 w-full">
          <StatTicker country={country} />
        </div>
      </motion.div>
    </main>
  );
}
