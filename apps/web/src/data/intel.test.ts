import { describe, expect, it } from "vitest";
import { INTEL_STATS, nationalLossStat } from "@/data/intel";

describe("national loss stat", () => {
  it("picks the US total for a US player", () => {
    expect(nationalLossStat("us").id).toBe("us-total-2024");
  });

  it("picks the India total for an India player", () => {
    expect(nationalLossStat("in").id).toBe("in-total-2024");
  });

  it("returns a card the results screen can render in full", () => {
    for (const region of ["us", "in"] as const) {
      const s = nationalLossStat(region);
      expect(s.stat.trim().length).toBeGreaterThan(0);
      expect(s.headline.trim().length).toBeGreaterThan(0);
      expect(s.source.trim().length).toBeGreaterThan(0);
    }
  });
});

// The project's core claim is that no number in the game is invented. That is
// only true as long as this holds, so it is a test rather than a convention.
describe("intel integrity", () => {
  it("cites a source on every stat", () => {
    const unsourced = INTEL_STATS.filter((s) => !s.source || !s.source.trim());
    expect(unsourced.map((s) => s.id)).toEqual([]);
  });

  it("uses a unique id for every stat", () => {
    const ids = INTEL_STATS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tags every stat to a region the game actually ships", () => {
    const stray = INTEL_STATS.filter((s) => !["us", "in", "global"].includes(s.region));
    expect(stray.map((s) => s.id)).toEqual([]);
  });
});
