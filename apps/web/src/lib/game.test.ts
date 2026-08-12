import { describe, expect, it } from "vitest";
import { BOSS_CARDS, CARDS, type GameCard } from "@/data/cards";
import {
  BASE_POINTS,
  BOSS_MULTIPLIER,
  MAX_LEVEL,
  MAX_SPEED_BONUS,
  SESSION_LENGTH,
  STREAK_BONUS_CAP,
  STREAK_BONUS_PER,
  TIMER_SECONDS,
  createDailySession,
  getRadarLevel,
  isCorrect,
  levelFromXp,
  levelTitle,
  mulberry32,
  resolveRound,
  scoreRound,
  summarize,
  xpForLevel,
  type RoundResult,
} from "@/lib/game";

// A stable set of ids the daily deck is allowed to draw from (global pool +
// bosses), so we can prove every dealt card is real card data.
const ALL_CARD_IDS = new Set([...CARDS, ...BOSS_CARDS].map((c) => c.id));

// Helper: build a minimal RoundResult around a real card for scoring tests.
function makeResult(card: GameCard, over: Partial<RoundResult> = {}): RoundResult {
  return {
    card,
    choice: "scam",
    correct: true,
    remainingMs: 0,
    points: 0,
    streak: 0,
    ...over,
  };
}

const aScamCard = CARDS.find((c) => c.isScam && (c.lossAmount ?? 0) > 0)!;
const anotherScamCard = CARDS.find(
  (c) => c.isScam && (c.lossAmount ?? 0) > 0 && c.id !== aScamCard.id,
)!;
const aLegitCard = CARDS.find((c) => !c.isScam)!;

describe("mulberry32 PRNG determinism", () => {
  it("produces an identical sequence for the same seed", () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = Array.from({ length: 10 }, mulberry32(1));
    const b = Array.from({ length: 10 }, mulberry32(2));
    expect(a).not.toEqual(b);
  });

  it("emits values in the unit interval", () => {
    const rand = mulberry32(999);
    for (let i = 0; i < 100; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("daily deck builder (hashString + mulberry32 seeding)", () => {
  it("returns the identical ordered deck for the same date key", () => {
    const a = createDailySession("2026-01-15").map((c) => c.id);
    const b = createDailySession("2026-01-15").map((c) => c.id);
    expect(a).toEqual(b);
  });

  it("returns a different order for a different date key", () => {
    const a = createDailySession("2026-01-15").map((c) => c.id);
    const b = createDailySession("2026-01-16").map((c) => c.id);
    // Two distinct date keys hash to distinct seeds → distinct deck orders.
    expect(a).not.toEqual(b);
  });

  it("deals no duplicate cases", () => {
    const ids = createDailySession("2026-03-01").map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only deals cases that exist in the real card data", () => {
    for (const card of createDailySession("2026-03-01")) {
      expect(ALL_CARD_IDS.has(card.id)).toBe(true);
    }
  });

  it("respects the session size (12 + boss finale)", () => {
    const deck = createDailySession("2026-03-01");
    expect(deck.length).toBe(SESSION_LENGTH + 1);
    expect(deck[deck.length - 1].boss).toBe(true);
  });

  it("draws only from the shared global region pool", () => {
    for (const card of createDailySession("2026-03-01")) {
      // undefined region defaults to 'global'; nothing region-specific is dealt.
      expect(card.region ?? "global").toBe("global");
    }
  });
});

describe("round resolution and scoring", () => {
  it("marks a matching scam call correct and a mismatch wrong", () => {
    expect(isCorrect(aScamCard, "scam")).toBe(true);
    expect(isCorrect(aScamCard, "legit")).toBe(false);
    expect(isCorrect(aLegitCard, "legit")).toBe(true);
    expect(isCorrect(aScamCard, "timeout")).toBe(false);
  });

  it("adds points and increments the streak on a correct answer", () => {
    const res = resolveRound(aScamCard, "scam", 0, 2);
    expect(res.correct).toBe(true);
    expect(res.streak).toBe(3);
    expect(res.points).toBeGreaterThan(0);
    // No speed bonus at 0ms, streak-of-2 bonus applies.
    expect(res.points).toBe(BASE_POINTS + 2 * STREAK_BONUS_PER);
  });

  it("resets the streak and awards zero points on a wrong answer", () => {
    const res = resolveRound(aScamCard, "legit", 5000, 4);
    expect(res.correct).toBe(false);
    expect(res.streak).toBe(0);
    expect(res.points).toBe(0);
  });

  it("resets the streak on a timeout", () => {
    const res = resolveRound(aScamCard, "timeout", 0, 7);
    expect(res.correct).toBe(false);
    expect(res.streak).toBe(0);
    expect(res.points).toBe(0);
  });

  it("awards the full speed bonus for an instant answer", () => {
    const full = TIMER_SECONDS * 1000;
    expect(scoreRound(full, 0)).toBe(BASE_POINTS + MAX_SPEED_BONUS);
  });

  it("awards no speed bonus at the buzzer", () => {
    expect(scoreRound(0, 0)).toBe(BASE_POINTS);
  });

  it("scales the speed bonus with remaining time", () => {
    const half = (TIMER_SECONDS * 1000) / 2;
    expect(scoreRound(half, 0)).toBe(BASE_POINTS + MAX_SPEED_BONUS / 2);
  });

  it("caps the streak bonus", () => {
    // A very long streak cannot exceed the cap.
    const capped = scoreRound(0, 999);
    expect(capped).toBe(BASE_POINTS + STREAK_BONUS_CAP);
  });

  it("doubles points on the boss finale", () => {
    const boss = BOSS_CARDS.find((c) => c.boss)!;
    const choice = boss.isScam ? "scam" : "legit";
    const res = resolveRound(boss, choice, 0, 0);
    expect(res.points).toBe(scoreRound(0, 0) * BOSS_MULTIPLIER);
  });
});

describe("money math in the run summary", () => {
  it("accumulates moneySaved on caught scams and moneyLost on misses", () => {
    const caught = makeResult(aScamCard, {
      choice: "scam",
      correct: true,
      streak: 1,
      points: 100,
    });
    const missed = makeResult(anotherScamCard, {
      choice: "legit",
      correct: false,
      streak: 0,
      points: 0,
    });
    const summary = summarize([caught, missed], 3);
    expect(summary.moneySaved).toBe(aScamCard.lossAmount ?? 0);
    expect(summary.moneyLost).toBe(anotherScamCard.lossAmount ?? 0);
    expect(summary.caughtScams).toHaveLength(1);
    expect(summary.missedScams).toHaveLength(1);
  });

  it("counts a timed-out scam as money lost, not a false alarm", () => {
    const timedOut = makeResult(aScamCard, {
      choice: "timeout",
      correct: false,
      streak: 0,
      points: 0,
    });
    const summary = summarize([timedOut], 3);
    expect(summary.moneyLost).toBe(aScamCard.lossAmount ?? 0);
    expect(summary.moneySaved).toBe(0);
    expect(summary.falseAlarms).toHaveLength(0);
  });

  it("tracks bestStreak, accuracy and gameOver honestly", () => {
    const r1 = makeResult(aScamCard, { correct: true, streak: 1, points: 100 });
    const r2 = makeResult(anotherScamCard, {
      correct: true,
      streak: 2,
      points: 100,
    });
    const r3 = makeResult(aLegitCard, {
      choice: "scam",
      correct: false,
      streak: 0,
      points: 0,
    });
    const summary = summarize([r1, r2, r3], 0);
    expect(summary.answered).toBe(3);
    expect(summary.correct).toBe(2);
    expect(summary.accuracy).toBeCloseTo(2 / 3);
    expect(summary.bestStreak).toBe(2);
    expect(summary.score).toBe(200);
    expect(summary.gameOver).toBe(true);
    expect(summary.falseAlarms).toHaveLength(1);
  });
});

describe("XP and level curve", () => {
  it("keeps cumulative XP thresholds strictly ordered", () => {
    for (let level = 2; level <= MAX_LEVEL; level++) {
      expect(xpForLevel(level)).toBeGreaterThan(xpForLevel(level - 1));
    }
    expect(xpForLevel(1)).toBe(0);
  });

  it("is monotonic: more XP never lowers the level", () => {
    let prev = levelFromXp(0);
    for (let xp = 0; xp <= 200_000; xp += 1000) {
      const lvl = levelFromXp(xp);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      prev = lvl;
    }
  });

  it("clamps the level to the 1..MAX_LEVEL range", () => {
    expect(levelFromXp(-999)).toBe(1);
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(xpForLevel(MAX_LEVEL))).toBe(MAX_LEVEL);
    expect(levelFromXp(xpForLevel(MAX_LEVEL) + 1_000_000)).toBe(MAX_LEVEL);
  });

  it("lands exactly on each threshold's level", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      expect(levelFromXp(xpForLevel(level))).toBe(level);
    }
  });

  it("names ranks by five-level bands", () => {
    expect(levelTitle(1)).toBe("NPC");
    expect(levelTitle(5)).toBe("NPC");
    expect(levelTitle(6)).toBe("Kinda Sus");
    expect(levelTitle(10)).toBe("Kinda Sus");
    expect(levelTitle(MAX_LEVEL)).toBe("Final Boss");
    // Out-of-range inputs clamp to the ends.
    expect(levelTitle(0)).toBe("NPC");
    expect(levelTitle(999)).toBe("Final Boss");
  });
});

describe("radar level boundaries", () => {
  it("returns the right radar at each edge", () => {
    expect(getRadarLevel(0).name).toBe("Absolutely Cooked");
    expect(getRadarLevel(0.39).name).toBe("Absolutely Cooked");
    expect(getRadarLevel(0.4).name).toBe("Still Mid");
    expect(getRadarLevel(0.64).name).toBe("Still Mid");
    expect(getRadarLevel(0.65).name).toBe("Lowkey Ate");
    expect(getRadarLevel(0.84).name).toBe("Lowkey Ate");
    expect(getRadarLevel(0.85).name).toBe("No Crumbs");
    expect(getRadarLevel(1).name).toBe("No Crumbs");
  });
});
