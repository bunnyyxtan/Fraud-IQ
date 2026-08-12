import { describe, expect, it } from "vitest";
import {
  MAX_MONEY_PER_RUN,
  isImpossibleRun,
  submitScoreBody,
} from "./fraudIq";

/**
 * Anti-cheat coverage for POST /fraud-iq/scores. Exercises the pure pieces of
 * the guard (the zod body schema + isImpossibleRun) with no database, auth,
 * rate-limit or daily-gauntlet involvement.
 */

// A realistic, fully-valid score submission the server should accept.
const validPayload = {
  playerId: 1,
  token: "0123456789abcdef0123456789abcdef",
  runId: "run-abc12345",
  mode: "classic" as const,
  score: 1800,
  accuracy: 92,
  bestStreak: 9,
  moneySaved: 5400,
  moneyLost: 1200,
  radarLevel: "No Crumbs" as const,
  gameOver: false,
};

// The five run fields isImpossibleRun inspects, pulled from a valid payload.
const validRun = {
  score: validPayload.score,
  accuracy: validPayload.accuracy,
  bestStreak: validPayload.bestStreak,
  moneySaved: validPayload.moneySaved,
  moneyLost: validPayload.moneyLost,
};

describe("submitScoreBody schema", () => {
  it("accepts a realistic, well-formed submission", () => {
    const parsed = submitScoreBody.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("defaults mode to classic when omitted", () => {
    const { mode: _mode, ...rest } = validPayload;
    const parsed = submitScoreBody.safeParse(rest);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.mode).toBe("classic");
  });

  it("rejects a missing playerId", () => {
    const { playerId: _playerId, ...rest } = validPayload;
    expect(submitScoreBody.safeParse(rest).success).toBe(false);
  });

  it("rejects a non-positive playerId", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, playerId: 0 }).success,
    ).toBe(false);
  });

  it("rejects a fractional playerId", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, playerId: 1.5 }).success,
    ).toBe(false);
  });

  it("rejects a token that is too short", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, token: "tooshort" }).success,
    ).toBe(false);
  });

  it("rejects a runId that is too short", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, runId: "short" }).success,
    ).toBe(false);
  });

  it("rejects an unknown mode", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, mode: "endless" }).success,
    ).toBe(false);
  });

  it("rejects a malformed runDate", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, runDate: "2026/01/01" })
        .success,
    ).toBe(false);
  });

  it("accepts a well-formed runDate", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, runDate: "2026-01-01" })
        .success,
    ).toBe(true);
  });

  it("rejects a non-integer score", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, score: 1800.5 }).success,
    ).toBe(false);
  });

  it("rejects a negative score", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, score: -1 }).success,
    ).toBe(false);
  });

  it("rejects a score above the run ceiling", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, score: 999999 }).success,
    ).toBe(false);
  });

  it("rejects accuracy above 100", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, accuracy: 101 }).success,
    ).toBe(false);
  });

  it("rejects a bestStreak above 13", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, bestStreak: 14 }).success,
    ).toBe(false);
  });

  it("rejects an unknown radarLevel", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, radarLevel: "Legend" })
        .success,
    ).toBe(false);
  });

  it("rejects moneySaved above the per-run cap", () => {
    expect(
      submitScoreBody.safeParse({
        ...validPayload,
        moneySaved: MAX_MONEY_PER_RUN + 1,
      }).success,
    ).toBe(false);
  });

  it("rejects a non-boolean gameOver", () => {
    expect(
      submitScoreBody.safeParse({ ...validPayload, gameOver: "yes" }).success,
    ).toBe(false);
  });
});

describe("isImpossibleRun guard", () => {
  it("accepts a realistic run", () => {
    expect(isImpossibleRun(validRun)).toBe(false);
  });

  it("accepts a legitimate zero-score run", () => {
    expect(
      isImpossibleRun({
        score: 0,
        accuracy: 0,
        bestStreak: 0,
        moneySaved: 0,
        moneyLost: 3000,
      }),
    ).toBe(false);
  });

  it("rejects score > 0 with accuracy 0", () => {
    expect(isImpossibleRun({ ...validRun, accuracy: 0 })).toBe(true);
  });

  it("rejects score > 0 with bestStreak 0", () => {
    expect(isImpossibleRun({ ...validRun, bestStreak: 0 })).toBe(true);
  });

  it("rejects moneySaved > 0 with score 0", () => {
    expect(
      isImpossibleRun({
        score: 0,
        accuracy: 0,
        bestStreak: 0,
        moneySaved: 500,
        moneyLost: 0,
      }),
    ).toBe(true);
  });

  it("rejects moneySaved + moneyLost above MAX_MONEY_PER_RUN", () => {
    expect(
      isImpossibleRun({
        ...validRun,
        moneySaved: MAX_MONEY_PER_RUN,
        moneyLost: 1,
      }),
    ).toBe(true);
  });

  it("accepts moneySaved + moneyLost exactly at the cap", () => {
    expect(
      isImpossibleRun({
        ...validRun,
        moneySaved: MAX_MONEY_PER_RUN - 1,
        moneyLost: 1,
      }),
    ).toBe(false);
  });
});
