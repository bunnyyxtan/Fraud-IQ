import { describe, expect, it } from "vitest";
import { buildDailyShareText, shareUrl, type DailyRecord } from "@/lib/game";

// The share text is the app's whole distribution loop, so its shape is worth
// pinning: a grid line that reads at a glance, and nothing that breaks on
// records saved before the grid existed.
const HIT = "\u25CF";
const MISS = "\u25CB";

const record: DailyRecord = {
  date: "2026-08-12",
  score: 2188,
  correct: 12,
  answered: 13,
  bestStreak: 9,
  moneySaved: 12_400,
  runId: "run-abc12345",
};

describe("daily share text", () => {
  it("renders one glyph per answered case, filled for a catch", () => {
    const marks = [true, true, false, true, true];
    const grid = buildDailyShareText({ ...record, marks }).split("\n")[1];
    expect(grid).toHaveLength(marks.length);
    expect(grid).toBe(`${HIT}${HIT}${MISS}${HIT}${HIT}`);
  });

  it("keeps the grid in the played order rather than sorting it", () => {
    const grid = buildDailyShareText({ ...record, marks: [false, true] }).split("\n")[1];
    expect(grid).toBe(`${MISS}${HIT}`);
  });

  it("omits the grid line for records saved before marks existed", () => {
    const text = buildDailyShareText(record);
    expect(text).not.toContain(HIT);
    expect(text).not.toContain(MISS);
    expect(text.split("\n")[0]).toContain("Fraud IQ Daily");
  });

  it("always leads with the date and carries score, accuracy and streak", () => {
    const text = buildDailyShareText({ ...record, marks: [true] });
    expect(text.split("\n")[0]).toMatch(/^Fraud IQ Daily · /);
    expect(text).toContain("12/13");
    expect(text).toContain("2188 pts");
    expect(text).toContain("streak 9");
  });

  it("drops the money brag when the run saved nothing", () => {
    const text = buildDailyShareText({ ...record, moneySaved: 0 });
    expect(text).not.toContain("Dodged");
    expect(text).toContain("Think you can beat me?");
  });

  it("uses the player's own currency", () => {
    expect(buildDailyShareText(record, "us")).toContain("$12,400");
    expect(buildDailyShareText(record, "in")).toContain("\u20B9");
  });

  it("emits no blank lines, which would look broken when pasted", () => {
    const text = buildDailyShareText({ ...record, marks: [true, false] });
    expect(text.split("\n").every((line) => line.trim().length > 0)).toBe(true);
  });
});

describe("share url", () => {
  it("stays empty outside a browser instead of inventing a domain", () => {
    expect(shareUrl()).toBe("");
    expect(buildDailyShareText(record)).not.toContain("http");
  });
});
