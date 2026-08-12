// Fraud IQ: pure game engine (no UI). The UI layer consumes this as-is.
// Rules are final; do not change scoring/lives/timer without updating docs/plan.md.

import { BOSS_CARDS, CARDS, RADAR_LEVELS, type GameCard, type Region } from '@/data/cards';

// ---------- session ----------

/**
 * Default cards per run, by tier, in play order (t1 warm-up → t3 expert).
 * The daily gauntlet ALWAYS uses this shape so the Today board stays fair.
 * Classic runs scale with player level via sessionShape() below.
 */
export const SESSION_SHAPE: Record<1 | 2 | 3, number> = { 1: 5, 2: 4, 3: 3 };

/**
 * Adaptive deck: newcomers drill the loud, classic cons; every few rungs of
 * the 50-level ladder another easy slot swaps for a subtle tier-3 tell,
 * until L50 deals a 9-expert deck. Always 12 cards + boss, so the timer,
 * lives, intel checkpoints, and the server score cap never move.
 * deckBand() labels derive from this shape, so they can never drift.
 */
export function sessionShape(level: number): Record<1 | 2 | 3, number> {
  const l = Math.min(Math.max(1, level), 50);
  /* tier-3 seats climb 1 -> 9 across the ladder */
  const t3 = Math.min(9, Math.max(1, Math.round(1 + ((l - 1) * 8) / 49)));
  /* the mid-tier bench swells mid-game, then thins for the endgame */
  const t2 = t3 <= 2 ? 4 : t3 <= 5 ? 5 : t3 <= 7 ? 4 : 3;
  const t1 = SESSION_LENGTH - t2 - t3;
  return { 1: t1, 2: t2, 3: t1 >= 0 ? t3 : t3 + t1 };
}

/** Honest one-liner describing the deck a player of this level draws. */
export function deckBand(level: number): string {
  const t3 = sessionShape(level)[3];
  if (t3 <= 1) return 'loud, classic cons';
  if (t3 <= 3) return 'the full mix';
  if (t3 <= 5) return 'subtle tells in play';
  if (t3 <= 7) return 'quiet, expert-grade tells';
  return 'boss-tier deception';
}

export const SESSION_LENGTH = 12;
export const LIVES = 3;
/** seconds per card */
/**
 * Dev-only E2E hook: `?timer=NN` (5-120s) stretches the countdown so automated
 * testers can drive full 13-case runs without timing out. Inert in production
 * builds (DEV flag is false) and in non-browser contexts.
 */
function timerSecondsOverride(): number | null {
  try {
    if (!import.meta.env?.DEV) return null;
    if (typeof window === 'undefined') return null;
    const raw = new URLSearchParams(window.location.search).get('timer');
    if (!raw) return null;
    const n = Math.floor(Number(raw));
    return Number.isFinite(n) ? Math.min(120, Math.max(5, n)) : null;
  } catch {
    return null;
  }
}
export const TIMER_SECONDS = timerSecondsOverride() ?? 15;
/** the boss finale (card 13) scores double */
export const BOSS_MULTIPLIER = 2;

// ---------- regions ----------

/** Countries with a dedicated training pool. Global cards serve every region. */
export type Country = Exclude<Region, 'global'>;

export const COUNTRY_META: Record<Country, { label: string; full: string }> = {
  us: { label: 'USA', full: 'United States' },
  in: { label: 'India', full: 'India' },
};

const COUNTRY_KEY = 'fraud-iq:country:v1';

export function loadCountry(): Country {
  try {
    const v = localStorage.getItem(COUNTRY_KEY);
    if (v === 'us' || v === 'in') return v;
  } catch {
    /* private mode */
  }
  return 'us';
}

export function saveCountry(country: Country): void {
  try {
    localStorage.setItem(COUNTRY_KEY, country);
  } catch {
    /* non-fatal */
  }
}

function cardRegion(c: GameCard): Region {
  return c.region ?? 'global';
}

/** Cards a player in `country` trains on: their region plus the shared global pool. */
function regionPool(cards: readonly GameCard[], country: Country): GameCard[] {
  return cards.filter((c) => cardRegion(c) === 'global' || cardRegion(c) === country);
}

/** Cards every player worldwide shares (used by the daily gauntlet). */
function globalPool(cards: readonly GameCard[]): GameCard[] {
  return cards.filter((c) => cardRegion(c) === 'global');
}

/** Honest UI copy for the selected region. */
export function poolStats(country: Country): { size: number; categories: number } {
  const pool = regionPool(CARDS, country);
  return {
    size: pool.length,
    categories: new Set(pool.map((c) => c.category)).size,
  };
}

// ---------- pool facts (derived from data, for honest UI copy) ----------

export const POOL_SIZE = CARDS.length;
export const CATEGORY_COUNT = new Set(CARDS.map((c) => c.category)).size;

function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a 12-card session from a given pool, tier counts given by `shape`
 * (easiest tier first, in play order).
 * Freshness rules, in priority order:
 * 1. Cards the player has NOT seen before come first (pass `loadSeen()`).
 * 2. Within a run, avoid repeating a category while alternatives exist,
 *    so every session feels like a tour across the scam landscape.
 */
function buildSession(
  rand: () => number,
  seen: ReadonlySet<string>,
  cards: readonly GameCard[],
  bosses: readonly GameCard[],
  shape: Record<1 | 2 | 3, number> = SESSION_SHAPE,
): GameCard[] {
  const session: GameCard[] = [];
  const usedCategories = new Set<GameCard['category']>();
  ([1, 2, 3] as const).forEach((tier) => {
    const pool = shuffle(cards.filter((c) => c.tier === tier), rand);
    const ranked = [
      ...pool.filter((c) => !seen.has(c.id)),
      ...pool.filter((c) => seen.has(c.id)),
    ];
    const picked: GameCard[] = [];
    // pass 1: prefer categories this run has not shown yet
    for (const c of ranked) {
      if (picked.length >= shape[tier]) break;
      if (usedCategories.has(c.category)) continue;
      picked.push(c);
      usedCategories.add(c.category);
    }
    // pass 2: fill remaining slots regardless of category
    for (const c of ranked) {
      if (picked.length >= shape[tier]) break;
      if (!picked.includes(c)) picked.push(c);
    }
    session.push(...picked);
  });
  // Boss finale: one card from the boss pool closes the run, unseen-first.
  const bossPool = shuffle([...bosses], rand);
  const boss = bossPool.find((c) => !seen.has(c.id)) ?? bossPool[0];
  if (boss) session.push(boss);
  return session;
}

/**
 * A classic run for the player's selected country (their region + global pool).
 * `level` tunes the tier mix: early levels drill loud scams, veterans get
 * the subtle ones. See sessionShape().
 */
export function createSession(
  rand: () => number = Math.random,
  seen: ReadonlySet<string> = new Set(),
  country: Country = 'us',
  level: number = 1,
): GameCard[] {
  return buildSession(
    rand,
    seen,
    regionPool(CARDS, country),
    regionPool(BOSS_CARDS, country),
    sessionShape(level),
  );
}

// ---------- answering & scoring ----------

export type Choice = 'scam' | 'legit' | 'timeout';

export interface RoundResult {
  card: GameCard;
  choice: Choice;
  correct: boolean;
  /** ms left on the clock when answered (0 for timeout) */
  remainingMs: number;
  /** points earned this round */
  points: number;
  /** streak AFTER this round */
  streak: number;
}

export const BASE_POINTS = 100;
export const MAX_SPEED_BONUS = 50;
/** +10 per consecutive correct beyond the first, capped */
export const STREAK_BONUS_PER = 10;
export const STREAK_BONUS_CAP = 100;

export function isCorrect(card: GameCard, choice: Choice): boolean {
  if (choice === 'timeout') return false;
  return (choice === 'scam') === card.isScam;
}

/** Points for a correct answer. Wrong/timeout always scores 0. */
export function scoreRound(remainingMs: number, streakBefore: number): number {
  const speed = Math.round(
    Math.max(0, Math.min(1, remainingMs / (TIMER_SECONDS * 1000))) * MAX_SPEED_BONUS,
  );
  const streakBonus = Math.min(streakBefore * STREAK_BONUS_PER, STREAK_BONUS_CAP);
  return BASE_POINTS + speed + streakBonus;
}

/**
 * Resolve one round. `streakBefore` = consecutive correct answers before this card.
 */
export function resolveRound(
  card: GameCard,
  choice: Choice,
  remainingMs: number,
  streakBefore: number,
): RoundResult {
  const correct = isCorrect(card, choice);
  return {
    card,
    choice,
    correct,
    remainingMs,
    points: correct
      ? scoreRound(remainingMs, streakBefore) * (card.boss ? BOSS_MULTIPLIER : 1)
      : 0,
    streak: correct ? streakBefore + 1 : 0,
  };
}

// ---------- summary ----------

export interface GameSummary {
  /** unique id for this completed run; the server dedupes submissions on it */
  runId: string;
  score: number;
  answered: number;
  correct: number;
  accuracy: number; // 0..1 over answered cards
  bestStreak: number;
  /** scams the player trusted (or timed out on): the money shot */
  missedScams: RoundResult[];
  /** total $ the player would have lost to missed scams */
  moneyLost: number;
  /** scams correctly caught */
  caughtScams: RoundResult[];
  /** total $ saved by catching scams */
  moneySaved: number;
  /** legit messages wrongly flagged as scam (paranoia tax) */
  falseAlarms: RoundResult[];
  /** every answered round, drives lifetime per-category tallies */
  results: RoundResult[];
  radar: (typeof RADAR_LEVELS)[number];
  /** true when the run ended by losing all lives */
  gameOver: boolean;
}

export function getRadarLevel(accuracy: number) {
  let level: (typeof RADAR_LEVELS)[number] = RADAR_LEVELS[0];
  for (const l of RADAR_LEVELS) if (accuracy >= l.min) level = l;
  return level;
}

function newRunId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return 'run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export function summarize(results: RoundResult[], livesLeft: number): GameSummary {
  const answered = results.length;
  const correct = results.filter((r) => r.correct).length;
  const accuracy = answered === 0 ? 0 : correct / answered;
  let bestStreak = 0;
  for (const r of results) bestStreak = Math.max(bestStreak, r.streak);
  const missedScams = results.filter((r) => r.card.isScam && !r.correct);
  const caughtScams = results.filter((r) => r.card.isScam && r.correct);
  const falseAlarms = results.filter((r) => !r.card.isScam && !r.correct && r.choice !== 'timeout');
  return {
    runId: newRunId(),
    score: results.reduce((s, r) => s + r.points, 0),
    answered,
    correct,
    accuracy,
    bestStreak,
    missedScams,
    moneyLost: missedScams.reduce((s, r) => s + (r.card.lossAmount ?? 0), 0),
    caughtScams,
    moneySaved: caughtScams.reduce((s, r) => s + (r.card.lossAmount ?? 0), 0),
    falseAlarms,
    results,
    radar: getRadarLevel(accuracy),
    gameOver: livesLeft <= 0,
  };
}

// ---------- formatting ----------

/** $1,250 style (US grouping, whole dollars) */
/**
 * Every lossAmount is authored in USD. Indian players see rupees at a fixed
 * representative rate (display only), rounded to a clean 100 with Indian
 * digit grouping so amounts read naturally (e.g. 1,05,600).
 */
const INR_PER_USD = 88;
export function formatMoney(amount: number, country: Country = 'us'): string {
  if (country === 'in') {
    const inr = Math.round((amount * INR_PER_USD) / 100) * 100;
    return '₹' + inr.toLocaleString('en-IN');
  }
  return '$' + amount.toLocaleString('en-US');
}


// ---------- XP & levels (must stay in sync with the API server) ----------

/** The ladder tops out here. Every rung past L1 costs more XP than the last. */
export const MAX_LEVEL = 50;

/** Cumulative XP needed to reach a level (level 1 = 0 XP, capped at MAX_LEVEL). */
export function xpForLevel(level: number): number {
  const l = Math.min(Math.max(1, level), MAX_LEVEL);
  return Math.round(400 * Math.pow(l - 1, 1.7));
}

/** Every run's score converts 1:1 into lifetime XP. */
export function levelFromXp(xp: number): number {
  const safe = Math.max(0, xp);
  let level = 1;
  while (level < MAX_LEVEL && safe >= xpForLevel(level + 1)) level++;
  return level;
}

/** 0..1 progress from the current level toward the next (1 once maxed). */
export function levelProgress(xp: number): number {
  const level = levelFromXp(xp);
  if (level >= MAX_LEVEL) return 1;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return Math.max(0, Math.min(1, (xp - floor) / (ceil - floor)));
}

export const LEVEL_TITLES = [
  'NPC',
  'Kinda Sus',
  'Side Eye',
  'Red Flag Radar',
  'Delulu Detector',
  'Cap Detector',
  'Rizz Proof',
  'Scam Slayer',
  'Built Different',
  'Final Boss',
] as const;

export function levelTitle(level: number): string {
  const idx = Math.floor((Math.min(Math.max(1, level), MAX_LEVEL) - 1) / 5);
  return LEVEL_TITLES[Math.min(idx, LEVEL_TITLES.length - 1)];
}

/**
 * One flex line per tier, shown under the level on profile and results.
 * The audience learns scam-spotting in its own language, so these stay
 * Gen Z, lowercase, and short enough for a single mobile line.
 * Mirrors LEVEL_TITLES by index.
 */
export const LEVEL_TAGLINES = [
  'scammers got you on speed dial 💀',
  'starting to leave scammers on read',
  "every 'hi dear' gets the side eye",
  'clocks red flags from across the app',
  "the delulu stories don't land anymore",
  'smells cap through the screen',
  'romance scammers log off crying',
  'scammers block YOU first',
  'this blud is hard to scam 😭',
  'the one scammers warn each other about 🔥',
] as const;

export function levelTagline(level: number): string {
  const idx = Math.floor((Math.min(Math.max(1, level), MAX_LEVEL) - 1) / 5);
  return LEVEL_TAGLINES[Math.min(idx, LEVEL_TAGLINES.length - 1)];
}

/** One row per level, precomputed for the profile ladder UI. */
export interface LadderRung {
  level: number;
  xp: number;
  title: string;
  tagline: string;
  shape: Record<1 | 2 | 3, number>;
  band: string;
}

export const LEVEL_LADDER: readonly LadderRung[] = Array.from({ length: MAX_LEVEL }, (_, i) => {
  const level = i + 1;
  return {
    level,
    xp: xpForLevel(level),
    title: levelTitle(level),
    tagline: levelTagline(level),
    shape: sessionShape(level),
    band: deckBand(level),
  };
});

// ---------- persistence ----------

const STORAGE_KEY = 'fraud-iq:stats:v1';

export interface CategoryTally {
  right: number;
  wrong: number;
}

export interface Stats {
  bestScore: number;
  gamesPlayed: number;
  /** lifetime $ saved by catching scams */
  lifetimeSaved: number;
  /** lifetime $ that slipped past on missed scams */
  lifetimeLost: number;
  totalAnswered: number;
  totalCorrect: number;
  /** lifetime XP mirror (score adds 1:1), drives the adaptive deck for guests */
  totalXp: number;
  bestStreak: number;
  /** consecutive calendar days (gauntlet clock) with at least one finished run */
  dayStreak: number;
  /** date key of the last finished run, drives dayStreak continuation */
  lastPlayedDate: string | null;
  /** lifetime right/wrong per scam category, feeds the profile fraud file */
  categories: Record<string, CategoryTally>;
}

// ---------- seen cards (drives unseen-first sampling) ----------

const SEEN_KEY = 'fraud-iq:seen:v1';

export function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.filter((x): x is string => typeof x === 'string'));
      }
    }
  } catch {
    /* corrupted storage - start fresh */
  }
  return new Set();
}

/**
 * Record cards as seen. When the player has effectively toured their
 * country's pool, that pool's entries reset to just this session so
 * unseen-first sampling keeps rotating content instead of degenerating
 * into uniform randomness. Other regions' history is left untouched.
 */
export function markSeen(cards: GameCard[], country: Country = loadCountry()): void {
  try {
    const seen = loadSeen();
    for (const c of cards) seen.add(c.id);
    // Coverage is measured against the pool this player actually draws from
    // (their country + global). Counting the whole card file would mean a
    // single-region player never triggers the reset once their pool runs dry.
    const universe = new Set(regionPool(CARDS, country).map((c) => c.id));
    let covered = 0;
    for (const id of seen) if (universe.has(id)) covered++;
    let next: string[];
    if (covered >= universe.size - SESSION_LENGTH) {
      const sessionIds = new Set(cards.map((c) => c.id));
      next = [...seen].filter((id) => !universe.has(id) || sessionIds.has(id));
    } else {
      next = [...seen];
    }
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    /* private mode - non-fatal */
  }
}

// ---------- player profile (nickname "login") ----------

const AVATAR_KEY = 'fraud-iq:avatar:v1';

/** Guest's locally chosen avatar; carried onto the server profile at claim time. */
export function loadGuestAvatar(): string | null {
  try {
    return localStorage.getItem(AVATAR_KEY) || null;
  } catch {
    return null;
  }
}

export function saveGuestAvatar(id: string): void {
  try {
    localStorage.setItem(AVATAR_KEY, id);
  } catch {
    /* private mode: non-fatal */
  }
}

/**
 * Case file archive: which intel files the player has recovered mid-run.
 * Device-local by design; the archive is a personal field manual.
 */
const INTEL_KEY = 'fraud-iq:intel:v1';

export function loadIntelCollected(): Set<string> {
  if (!storageAvailable) return new Set();
  try {
    const raw = localStorage.getItem(INTEL_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

/**
 * Archive a recovered file. Returns whether it was new to the collection
 * plus the full collected set (already including this file).
 */
export function collectIntelFile(id: string): { isNew: boolean; collected: Set<string> } {
  const collected = loadIntelCollected();
  const isNew = !collected.has(id);
  collected.add(id);
  if (storageAvailable) {
    try {
      localStorage.setItem(INTEL_KEY, JSON.stringify([...collected]));
    } catch {
      /* storage full or blocked: the file still counts for this session */
    }
  }
  return { isNew, collected };
}

const PROFILE_KEY = 'fraud-iq:player:v1';

export interface PlayerProfile {
  id: number;
  name: string;
  token: string;
  /** explicit avatar pick; null/absent = deterministic default from id */
  avatar?: string | null;
}

export function loadProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.id === 'number' && typeof p?.name === 'string' && typeof p?.token === 'string') {
      return p as PlayerProfile;
    }
  } catch {
    /* corrupted storage: treat as signed out */
  }
  return null;
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode: non-fatal */
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* non-fatal */
  }
}

/**
 * True when this browsing context lets us persist data. Some embeds and
 * private modes deny localStorage entirely (the calls above throw and are
 * swallowed), so a signed name would silently vanish on the next refresh.
 * The UI uses this flag to warn instead of failing silently.
 */
export const storageAvailable: boolean = (() => {
  try {
    const probe = 'fraud-iq:probe';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
})();

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<keyof Stats, unknown>>;
      const num = (v: unknown) =>
        typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0;
      /* pre-profile installs have none of the newer fields; every one of them
         degrades to zero/empty so old devices migrate silently */
      const categories: Record<string, CategoryTally> = {};
      if (parsed.categories && typeof parsed.categories === 'object') {
        for (const [key, value] of Object.entries(parsed.categories as Record<string, unknown>)) {
          if (value && typeof value === 'object') {
            const tally = value as Partial<CategoryTally>;
            categories[key] = { right: num(tally.right), wrong: num(tally.wrong) };
          }
        }
      }
      return {
        bestScore: num(parsed.bestScore),
        gamesPlayed: num(parsed.gamesPlayed),
        lifetimeSaved: num(parsed.lifetimeSaved),
        lifetimeLost: num(parsed.lifetimeLost),
        totalAnswered: num(parsed.totalAnswered),
        totalCorrect: num(parsed.totalCorrect),
        /* pre-xp installs: their best run is an honest lower bound on lifetime
           XP, so veterans don't restart on the training-wheels deck */
        totalXp: Math.max(num(parsed.totalXp), num(parsed.bestScore)),
        bestStreak: num(parsed.bestStreak),
        dayStreak: num(parsed.dayStreak),
        lastPlayedDate: typeof parsed.lastPlayedDate === 'string' ? parsed.lastPlayedDate : null,
        categories,
      };
    }
  } catch {
    /* corrupted storage, start fresh */
  }
  return {
    bestScore: 0,
    gamesPlayed: 0,
    lifetimeSaved: 0,
    lifetimeLost: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    totalXp: 0,
    bestStreak: 0,
    dayStreak: 0,
    lastPlayedDate: null,
    categories: {},
  };
}

/** The date key immediately before `key` (both YYYY-MM-DD), pure UTC math. */
function previousDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export function recordGame(summary: GameSummary): Stats {
  const prev = loadStats();
  const categories: Record<string, CategoryTally> = { ...prev.categories };
  for (const r of summary.results) {
    const tally = categories[r.card.category] ?? { right: 0, wrong: 0 };
    categories[r.card.category] = {
      right: tally.right + (r.correct ? 1 : 0),
      wrong: tally.wrong + (r.correct ? 0 : 1),
    };
  }
  // Day streak on the same clock as the daily gauntlet: same day keeps it,
  // the day right after extends it, any gap resets to 1.
  const today = dailyDateKey();
  const dayStreak =
    prev.lastPlayedDate === today
      ? Math.max(prev.dayStreak, 1)
      : prev.lastPlayedDate === previousDateKey(today)
        ? prev.dayStreak + 1
        : 1;
  const next: Stats = {
    bestScore: Math.max(prev.bestScore, summary.score),
    gamesPlayed: prev.gamesPlayed + 1,
    lifetimeSaved: prev.lifetimeSaved + summary.moneySaved,
    lifetimeLost: prev.lifetimeLost + summary.moneyLost,
    totalAnswered: prev.totalAnswered + summary.answered,
    totalCorrect: prev.totalCorrect + summary.correct,
    totalXp: prev.totalXp + summary.score,
    bestStreak: Math.max(prev.bestStreak, summary.bestStreak),
    dayStreak,
    lastPlayedDate: today,
    categories,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode: non-fatal */
  }
  return next;
}

// ---------------- daily gauntlet ----------------

export type GameMode = 'classic' | 'daily';

const DAILY_KEY = 'fraud-iq:daily:v1';

/** One record per calendar day (US Eastern). Its presence = today's shot is used. */
export interface DailyRecord {
  /** YYYY-MM-DD in US Eastern */
  date: string;
  score: number;
  correct: number;
  answered: number;
  bestStreak: number;
  moneySaved: number;
  runId: string;
  /** one entry per answered case, in play order, drives the shareable grid */
  marks?: boolean[];
}

/** Deterministic PRNG (mulberry32) so every player gets the same daily deck. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a: stable string to 32-bit seed */
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The gauntlet flips at midnight US Eastern, where the audience lives. Mirrored on the server. */
export function dailyDateKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now);
}

/** 'Aug 11' style label for a YYYY-MM-DD key */
export function formatDailyDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

/**
 * Same 13 cards in the same order for everyone on a given date, boss included.
 * Global-region cards only, so every country plays the identical deck and
 * the Today board stays a single fair competition.
 */
export function createDailySession(dateKey: string): GameCard[] {
  return buildSession(
    mulberry32(hashString(`fraud-iq-daily:${dateKey}`)),
    new Set(),
    globalPool(CARDS),
    globalPool(BOSS_CARDS),
    // fixed default shape: every player worldwide faces the identical deck
    SESSION_SHAPE,
  );
}

export function loadDailyRecord(): DailyRecord | null {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<DailyRecord>;
    if (typeof p?.date === 'string' && typeof p?.score === 'number') return p as DailyRecord;
  } catch {
    /* corrupted storage: treat as not played */
  }
  return null;
}

export function saveDailyRecord(record: DailyRecord): void {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(record));
  } catch {
    /* private mode: non-fatal */
  }
}

/** Clipboard-ready brag, built to paste clean anywhere. */
/** Caught it. Same filled dot the results screen uses for a correct call. */
const MARK_HIT = '\u25CF';
/** Fell for it, or ran out of clock. */
const MARK_MISS = '\u25CB';

/**
 * Where a shared result points back to. Read off the live origin so a published
 * build shares its own public URL and a dev build shares the dev one, with no
 * hardcoded domain to rot.
 */
export function shareUrl(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  if (!/^https?:/i.test(origin)) return '';
  return origin + import.meta.env.BASE_URL;
}

/**
 * The copyable daily result. The grid carries the whole run at a glance, which
 * is the part that travels: someone who sees a row of dots with one hole in it
 * knows exactly what happened without reading a single number.
 */
export function buildDailyShareText(record: DailyRecord, country: Country = 'us'): string {
  const grid = record.marks?.length
    ? record.marks.map((hit) => (hit ? MARK_HIT : MARK_MISS)).join('')
    : '';
  const url = shareUrl();
  return [
    `Fraud IQ Daily · ${formatDailyDate(record.date)}`,
    grid,
    `${record.correct}/${record.answered} · ${record.score} pts · streak ${record.bestStreak}`,
    record.moneySaved > 0
      ? `Dodged ${formatMoney(record.moneySaved, country)} in scams. Think you can beat me?`
      : 'Think you can beat me?',
    url,
  ]
    .filter(Boolean)
    .join('\n');
}
