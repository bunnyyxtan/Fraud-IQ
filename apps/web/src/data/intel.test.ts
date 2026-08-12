import { describe, expect, it } from "vitest";
import { INTEL_STATS, pickIntel } from "@/data/intel";
import { CARDS } from "@/data/cards";
import { mulberry32, type Country } from "@/lib/game";

const COUNTRIES: Country[] = ["us", "in"];
const regionPool = (country: Country) => INTEL_STATS.filter((s) => s.region === country);

describe("intel data integrity", () => {
  it("has unique ids and a valid region on every file", () => {
    const ids = INTEL_STATS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of INTEL_STATS) expect(["us", "in"]).toContain(s.region);
  });

  it("keeps a healthy pool on both sides of the border", () => {
    expect(regionPool("us").length).toBeGreaterThanOrEqual(20);
    expect(regionPool("in").length).toBeGreaterThanOrEqual(15);
  });
});

describe("pickIntel selection", () => {
  const anyCard = CARDS[0];

  it("never crosses regions", () => {
    for (const country of COUNTRIES) {
      for (let seed = 0; seed < 40; seed++) {
        const card = CARDS[seed % CARDS.length];
        const intel = pickIntel(card, country, new Set(), new Set(), mulberry32(seed));
        expect(intel).not.toBeNull();
        expect(intel!.region).toBe(country);
      }
    }
  });

  it("never repeats within a run (usedIds respected)", () => {
    for (const country of COUNTRIES) {
      const used = new Set<string>();
      for (let i = 0; i < regionPool(country).length; i++) {
        const intel = pickIntel(CARDS[i % CARDS.length], country, used, new Set(), mulberry32(i));
        expect(intel).not.toBeNull();
        expect(used.has(intel!.id)).toBe(false);
        used.add(intel!.id);
      }
    }
  });

  it("prefers files the player has never collected", () => {
    for (const country of COUNTRIES) {
      const pool = regionPool(country);
      // collect everything except one arbitrary file: that survivor must win
      for (const survivor of [pool[0], pool[Math.floor(pool.length / 2)], pool[pool.length - 1]]) {
        const collected = new Set(pool.filter((s) => s.id !== survivor.id).map((s) => s.id));
        for (let seed = 0; seed < 10; seed++) {
          const intel = pickIntel(anyCard, country, new Set(), collected, mulberry32(seed));
          expect(intel!.id).toBe(survivor.id);
        }
      }
    }
  });

  it("falls back to the full pool once everything is collected", () => {
    for (const country of COUNTRIES) {
      const collected = new Set(regionPool(country).map((s) => s.id));
      const intel = pickIntel(anyCard, country, new Set(), collected, mulberry32(7));
      expect(intel).not.toBeNull();
      expect(intel!.region).toBe(country);
    }
  });

  it("back-to-back runs keep dealing NEW files until the archive is full", () => {
    for (const country of COUNTRIES) {
      const pool = regionPool(country);
      const collected = new Set<string>();
      const runs = Math.ceil(pool.length / 2);
      for (let run = 0; run < runs; run++) {
        const used = new Set<string>(); // per-run
        for (let stop = 0; stop < 2; stop++) {
          const card = CARDS[(run * 2 + stop) % CARDS.length];
          const intel = pickIntel(card, country, used, collected, mulberry32(run * 31 + stop));
          expect(intel).not.toBeNull();
          if (collected.size < pool.length) {
            // the old bug: same fact dealt run after run
            expect(collected.has(intel!.id)).toBe(false);
          }
          used.add(intel!.id);
          collected.add(intel!.id);
        }
      }
    }
  });

  it("shopping stops are no longer a one-fact monopoly", () => {
    const shoppingCard = CARDS.find((c) => c.category === "shopping")!;
    const seenIds = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      const intel = pickIntel(shoppingCard, "us", new Set(), new Set(), mulberry32(seed));
      seenIds.add(intel!.id);
    }
    expect(seenIds.size).toBeGreaterThanOrEqual(2);
  });
});
