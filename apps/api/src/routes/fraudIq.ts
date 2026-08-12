import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { z } from "zod/v4";
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  inArray,
  max,
  min,
  sql,
  sum,
} from "drizzle-orm";
import { db, fraudIqPlayers, fraudIqScores } from "@fraud-iq/db";

const router: IRouter = Router();

/**
 * Fraud IQ: leaderboard + lightweight player identity.
 * "Login" is privacy-by-design for a 13+ audience: a display name only.
 * No email, no password, no personal data. A random token issued at
 * creation authenticates score submissions from that device.
 */

// ---------- shared level math (mirrored in the web app's engine) ----------
export const MAX_LEVEL = 50;

export function xpForLevel(level: number): number {
  const l = Math.min(Math.max(1, level), MAX_LEVEL);
  return Math.round(400 * Math.pow(l - 1, 1.7));
}

export function levelFromXp(xp: number): number {
  const safe = Math.max(0, xp);
  let level = 1;
  while (level < MAX_LEVEL && safe >= xpForLevel(level + 1)) level++;
  return level;
}

export const LEVEL_TITLES = [
  "NPC",
  "Kinda Sus",
  "Side Eye",
  "Red Flag Radar",
  "Delulu Detector",
  "Cap Detector",
  "Rizz Proof",
  "Scam Slayer",
  "Built Different",
  "Final Boss",
] as const;

export function levelTitle(level: number): string {
  const idx = Math.floor((Math.min(Math.max(1, level), MAX_LEVEL) - 1) / 5);
  return LEVEL_TITLES[Math.min(idx, LEVEL_TITLES.length - 1)];
}

// ---------- name hygiene ----------
const NAME_BLOCKLIST = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "nigg",
  "fag",
  "dick",
  "cock",
  "porn",
  "rape",
  "nazi",
];

function cleanName(raw: string): string | null {
  const cleaned = raw
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} _.\-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  if (cleaned.length < 2) return null;
  const flat = cleaned.toLowerCase().replace(/[^a-z]/g, "");
  if (NAME_BLOCKLIST.some((w) => flat.includes(w))) return null;
  return cleaned;
}

// ---------- validation ----------
// Avatar allowlist, shared verbatim with the client's Avatar.tsx set.
const AVATAR_IDS = [
  "fox", "cat", "owl", "robot", "detective", "ghost",
  "alien", "shark", "snake", "bunny", "skull", "incognito",
] as const;

const createPlayerBody = z.object({
  name: z.string().min(1).max(64),
  avatar: z.enum(AVATAR_IDS).optional(),
});

const renamePlayerBody = z.object({
  playerId: z.number().int().positive(),
  token: z.string().min(16),
  name: z.string().min(1).max(64),
});

const avatarBody = z.object({
  playerId: z.number().int().positive(),
  token: z.string().min(16),
  avatar: z.enum(AVATAR_IDS),
});

// Hard caps derived from the game engine. Recompute if cards or scoring change:
// max score = 12 normal cards of (100 base + 50 speed + min(i*10, 100) streak) = 2450,
// plus the boss finale at full streak doubled: 2 * (100 + 50 + 100) = 500 → 2950
// Points have no tier multiplier, so the ceiling is the same for every deck
// shape the adaptive difficulty can deal (12 perfect fast answers with a full
// streak, plus the doubled boss).
const MAX_RUN_SCORE = 2950;
// Best-case money in one session across every adaptive deck shape and region.
// The 50-level ladder's hardest shape (3×t2 + 9×t3 at L50) tops out at 22,365
// on the IN pool (top scam lossAmounts + the 4,700 boss), so this bound holds
// with margin for every deck the ladder can deal. Recompute if card data or
// sessionShape() changes.
export const MAX_MONEY_PER_RUN = 37_400;
const RADAR_NAMES = [
  "Absolutely Cooked",
  "Still Mid",
  "Lowkey Ate",
  "No Crumbs",
  // legacy names, kept so an already-open old client bundle can still submit
  "Sitting Duck",
  "Street Smart",
  "Scam Hunter",
  "Fraud Analyst",
] as const;
// A real run cannot finish faster than this (even losing 3 lives instantly).
const MIN_RUN_GAP_MS = 10_000;

/** The daily gauntlet flips at midnight US Eastern. Mirrored in the web app. */
function etDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(new Date());
}

export const submitScoreBody = z.object({
  playerId: z.number().int().positive(),
  token: z.string().min(16).max(80),
  runId: z.string().min(8).max(40),
  mode: z.enum(["classic", "daily"]).default("classic"),
  /** client's ET date for a daily run; must match the server's ET date */
  runDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  score: z.number().int().min(0).max(MAX_RUN_SCORE),
  accuracy: z.number().int().min(0).max(100),
  bestStreak: z.number().int().min(0).max(13),
  moneySaved: z.number().int().min(0).max(MAX_MONEY_PER_RUN),
  moneyLost: z.number().int().min(0).max(MAX_MONEY_PER_RUN),
  radarLevel: z.enum(RADAR_NAMES),
  gameOver: z.boolean(),
});

/**
 * Cheap consistency checks: these combinations cannot come out of a real run.
 * Pure so it can be unit-tested without a database. The route calls this
 * verbatim; keep its behaviour byte-for-byte identical to the inline guard.
 */
export function isImpossibleRun(run: {
  score: number;
  accuracy: number;
  bestStreak: number;
  moneySaved: number;
  moneyLost: number;
}): boolean {
  return (
    (run.score > 0 && (run.accuracy === 0 || run.bestStreak === 0)) ||
    (run.moneySaved > 0 && run.score === 0) ||
    run.moneySaved + run.moneyLost > MAX_MONEY_PER_RUN
  );
}

async function authedPlayer(playerId: number, token: string) {
  const [player] = await db
    .select()
    .from(fraudIqPlayers)
    .where(eq(fraudIqPlayers.id, playerId))
    .limit(1);
  if (!player) return null;
  const a = Buffer.from(player.token);
  const b = Buffer.from(token);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return player;
}

async function playerAggregate(playerId: number) {
  const [agg] = await db
    .select({
      best: max(fraudIqScores.score),
      xp: sum(fraudIqScores.score),
      runs: count(),
    })
    .from(fraudIqScores)
    .where(eq(fraudIqScores.playerId, playerId));
  const bestScore = agg?.best ?? 0;
  const totalXp = Number(agg?.xp ?? 0);
  const runs = agg?.runs ?? 0;
  const level = levelFromXp(totalXp);
  return { bestScore, totalXp, runs, level, levelTitle: levelTitle(level) };
}

/**
 * Competition rank under ONE deterministic rule used everywhere:
 * better best score wins; equal best scores are broken by higher total XP;
 * players still tied after that share the same rank.
 */
async function globalRank(bestScore: number, totalXp: number): Promise<number> {
  const res = await db.execute(
    sql`select count(*)::int as ahead from (
          select max(score) as best, sum(score) as xp from fraud_iq_scores group by player_id
        ) b where b.best > ${bestScore} or (b.best = ${bestScore} and b.xp > ${totalXp})`,
  );
  const ahead = Number((res.rows[0] as { ahead?: number } | undefined)?.ahead ?? 0);
  return ahead + 1;
}

// ---------- routes ----------

// Create a player (the whole "login")
router.post("/fraud-iq/players", async (req, res) => {
  const parsed = createPlayerBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "A name is required." });
  }
  const name = cleanName(parsed.data.name);
  if (!name) {
    return res
      .status(400)
      .json({ error: "Pick a different name (2-16 letters or numbers)." });
  }
  const token = crypto.randomUUID().replace(/-/g, "");
  const [player] = await db
    .insert(fraudIqPlayers)
    .values({ name, token, avatar: parsed.data.avatar ?? null })
    .returning();
  return res.status(201).json({
    id: player.id,
    name: player.name,
    token: player.token,
    avatar: player.avatar,
    totalXp: 0,
    level: 1,
    levelTitle: levelTitle(1),
    bestScore: 0,
    runs: 0,
  });
});

// Change the display name. Same cleaning rules as claiming one; the
// leaderboard joins on player id, so history follows the new name.
router.patch("/fraud-iq/players/name", async (req, res) => {
  const parsed = renamePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "A name is required." });
  }
  const name = cleanName(parsed.data.name);
  if (!name) {
    return res
      .status(400)
      .json({ error: "Pick a different name (2-16 letters or numbers)." });
  }
  const player = await authedPlayer(parsed.data.playerId, parsed.data.token);
  if (!player) {
    return res.status(401).json({ error: "Unknown player. Sign in again." });
  }
  if (player.name !== name) {
    await db
      .update(fraudIqPlayers)
      .set({ name })
      .where(eq(fraudIqPlayers.id, player.id));
  }
  return res.json({ id: player.id, name });
});

// Change the profile picture. Allowlist-validated; the leaderboard joins on
// player id, so every board shows the new face immediately.
router.patch("/fraud-iq/players/avatar", async (req, res) => {
  const parsed = avatarBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Pick a face from the set." });
  }
  const player = await authedPlayer(parsed.data.playerId, parsed.data.token);
  if (!player) {
    return res.status(401).json({ error: "Unknown player. Sign in again." });
  }
  if (player.avatar !== parsed.data.avatar) {
    await db
      .update(fraudIqPlayers)
      .set({ avatar: parsed.data.avatar })
      .where(eq(fraudIqPlayers.id, player.id));
  }
  return res.json({ id: player.id, avatar: parsed.data.avatar });
});

// Submit a finished run
router.post("/fraud-iq/scores", async (req, res) => {
  const parsed = submitScoreBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid score payload." });
  }
  const { playerId, token, runId, runDate, ...run } = parsed.data;
  const player = await authedPlayer(playerId, token);
  if (!player) {
    return res.status(401).json({ error: "Unknown player. Sign in again." });
  }

  // Cheap consistency checks: these combinations cannot come out of a real run.
  const impossible = isImpossibleRun(run);
  if (impossible) {
    return res.status(400).json({ error: "Invalid score payload." });
  }

  // Idempotent replay FIRST: if this exact run is already stored (e.g. the
  // client retried after a lost response), return the current state untouched.
  // This must run before the rate limit so a quick retry is never rejected.
  const [existing] = await db
    .select({ id: fraudIqScores.id })
    .from(fraudIqScores)
    .where(
      and(eq(fraudIqScores.playerId, playerId), eq(fraudIqScores.runId, runId)),
    )
    .limit(1);
  if (existing) {
    const agg = await playerAggregate(playerId);
    const rank = await globalRank(agg.bestScore, agg.totalXp);
    return res.json({
      ...agg,
      rank,
      isNewBest: false,
      leveledUp: false,
      duplicate: true,
    });
  }

  // Daily gauntlet is server-enforced: the run must carry the server's
  // current ET date, and a player gets exactly one accepted score per day.
  // (Same-runId retries already returned above; reaching here means a NEW run.)
  if (run.mode === "daily") {
    if (runDate !== etDateKey()) {
      return res
        .status(409)
        .json({ error: "That gauntlet has closed. Come back for today's." });
    }
    const [already] = await db
      .select({ id: fraudIqScores.id })
      .from(fraudIqScores)
      .where(
        and(
          eq(fraudIqScores.playerId, playerId),
          eq(fraudIqScores.mode, "daily"),
          eq(fraudIqScores.runDate, runDate),
        ),
      )
      .limit(1);
    if (already) {
      return res
        .status(409)
        .json({ error: "You already played today's gauntlet." });
    }
  }

  // Rate limit: even a lost run takes longer than this to play.
  const [last] = await db
    .select({ createdAt: fraudIqScores.createdAt })
    .from(fraudIqScores)
    .where(eq(fraudIqScores.playerId, playerId))
    .orderBy(desc(fraudIqScores.createdAt))
    .limit(1);
  if (last && Date.now() - last.createdAt.getTime() < MIN_RUN_GAP_MS) {
    return res
      .status(429)
      .json({ error: "Too fast. Wait a few seconds and try again." });
  }

  const before = await playerAggregate(playerId);
  // Idempotent on (playerId, runId): retrying the same finished run never double-counts.
  const inserted = await db
    .insert(fraudIqScores)
    .values({ playerId, runId, runDate: etDateKey(), ...run })
    .onConflictDoNothing()
    .returning({ id: fraudIqScores.id });
  const duplicate = inserted.length === 0;
  const after = duplicate ? before : await playerAggregate(playerId);
  const rank = await globalRank(after.bestScore, after.totalXp);

  return res.json({
    ...after,
    rank,
    isNewBest: !duplicate && run.score > before.bestScore,
    leveledUp: !duplicate && after.level > before.level,
    duplicate,
  });
});

// Restore a player session (returning device)
router.get("/fraud-iq/me", async (req, res) => {
  const playerId = Number(req.query.playerId);
  const token = String(req.query.token ?? "");
  if (!Number.isInteger(playerId) || playerId <= 0 || token.length < 16) {
    return res.status(400).json({ error: "Missing player credentials." });
  }
  const player = await authedPlayer(playerId, token);
  if (!player) {
    return res.status(401).json({ error: "Unknown player. Sign in again." });
  }
  const agg = await playerAggregate(playerId);
  const rank = agg.runs > 0 ? await globalRank(agg.bestScore, agg.totalXp) : null;
  return res.json({ id: player.id, name: player.name, avatar: player.avatar, ...agg, rank });
});

// Global leaderboard + community stats.
// scope=today ranks every run logged today (ET, any mode); default is all time.
router.get("/fraud-iq/leaderboard", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

  if (req.query.scope === "today") {
    const today = etDateKey();
    const bestToday = max(fraudIqScores.score);
    const earliest = min(fraudIqScores.createdAt);
    const rows = await db
      .select({
        playerId: fraudIqScores.playerId,
        name: fraudIqPlayers.name,
        avatar: fraudIqPlayers.avatar,
        bestScore: bestToday,
        earliest,
        runs: count(),
      })
      .from(fraudIqScores)
      .innerJoin(fraudIqPlayers, eq(fraudIqPlayers.id, fraudIqScores.playerId))
      .where(eq(fraudIqScores.runDate, today))
      .groupBy(fraudIqScores.playerId, fraudIqPlayers.name, fraudIqPlayers.avatar)
      .orderBy(desc(bestToday), asc(earliest))
      .limit(limit);

    // Level titles come from global XP so a player's badge is stable across tabs.
    const ids = rows.map((r) => r.playerId);
    const xpRows = ids.length
      ? await db
          .select({
            playerId: fraudIqScores.playerId,
            xp: sum(fraudIqScores.score),
          })
          .from(fraudIqScores)
          .where(inArray(fraudIqScores.playerId, ids))
          .groupBy(fraudIqScores.playerId)
      : [];
    const xpByPlayer = new Map(xpRows.map((r) => [r.playerId, Number(r.xp ?? 0)]));

    // Equal scores rank by who got there first, so positions are strict.
    const entries = rows.map((r, i) => {
      const totalXp = xpByPlayer.get(r.playerId) ?? 0;
      const level = levelFromXp(totalXp);
      return {
        rank: i + 1,
        playerId: r.playerId,
        name: r.name,
        avatar: r.avatar,
        bestScore: r.bestScore ?? 0,
        totalXp,
        level,
        levelTitle: levelTitle(level),
        runs: r.runs,
      };
    });

    const [dailyStats] = await db
      .select({
        totalPlayers: countDistinct(fraudIqScores.playerId),
        totalRuns: count(),
        totalMoneySaved: sum(fraudIqScores.moneySaved),
      })
      .from(fraudIqScores)
      .where(eq(fraudIqScores.runDate, today));

    return res.json({
      entries,
      stats: {
        totalPlayers: dailyStats?.totalPlayers ?? 0,
        totalRuns: dailyStats?.totalRuns ?? 0,
        totalMoneySaved: Number(dailyStats?.totalMoneySaved ?? 0),
      },
    });
  }

  const bestExpr = max(fraudIqScores.score);
  const xpExpr = sum(fraudIqScores.score);
  const firstSeenExpr = min(fraudIqScores.createdAt);
  const rows = await db
    .select({
      playerId: fraudIqScores.playerId,
      name: fraudIqPlayers.name,
      avatar: fraudIqPlayers.avatar,
      bestScore: bestExpr,
      totalXp: xpExpr,
      runs: count(),
    })
    .from(fraudIqScores)
    .innerJoin(fraudIqPlayers, eq(fraudIqPlayers.id, fraudIqScores.playerId))
    .groupBy(fraudIqScores.playerId, fraudIqPlayers.name, fraudIqPlayers.avatar)
    .orderBy(desc(bestExpr), desc(xpExpr), asc(firstSeenExpr))
    .limit(limit);

  // Competition ranking, same rule as globalRank: ties on (best, xp) share a rank.
  let prevBest: number | null = null;
  let prevXp: number | null = null;
  let prevRank = 0;
  const entries = rows.map((r, i) => {
    const totalXp = Number(r.totalXp ?? 0);
    const bestScore = r.bestScore ?? 0;
    const rank =
      prevBest === bestScore && prevXp === totalXp ? prevRank : i + 1;
    prevBest = bestScore;
    prevXp = totalXp;
    prevRank = rank;
    const level = levelFromXp(totalXp);
    return {
      rank,
      playerId: r.playerId,
      name: r.name,
      avatar: r.avatar,
      bestScore,
      totalXp,
      level,
      levelTitle: levelTitle(level),
      runs: r.runs,
    };
  });

  const [stats] = await db
    .select({
      totalRuns: count(),
      totalMoneySaved: sum(fraudIqScores.moneySaved),
    })
    .from(fraudIqScores);
  const [playerCount] = await db
    .select({ totalPlayers: count() })
    .from(fraudIqPlayers);

  return res.json({
    entries,
    stats: {
      totalPlayers: playerCount?.totalPlayers ?? 0,
      totalRuns: stats?.totalRuns ?? 0,
      totalMoneySaved: Number(stats?.totalMoneySaved ?? 0),
    },
  });
});

export default router;
