import { describe, expect, it } from "vitest";
import { BOSS_CARDS, CARDS, type GameCard } from "@/data/cards";
import {
  SESSION_LENGTH,
  createSession,
  mulberry32,
  sessionShape,
  type Country,
} from "@/lib/game";

// Mirror of the region gate: 'global' (or unset) serves everyone, country
// codes only their own pool. Recomputed here so a gating regression in
// game.ts cannot silently agree with itself.
function eligible(cards: readonly GameCard[], country: Country): GameCard[] {
  return cards.filter((c) => !c.region || c.region === "global" || c.region === country);
}

const COUNTRIES: Country[] = ["us", "in"];

describe("createSession across every level and region", () => {
  for (const country of COUNTRIES) {
    it(`deals a valid deck for ${country} at levels 1..50`, () => {
      const mainPool = new Set(eligible(CARDS, country).map((c) => c.id));
      const bossPool = new Set(eligible(BOSS_CARDS, country).map((c) => c.id));
      for (let level = 1; level <= 50; level++) {
        const deck = createSession(mulberry32(level * 7919 + 1), new Set(), country, level);

        // 12 main cards + 1 boss finale, all unique
        expect(deck).toHaveLength(SESSION_LENGTH + 1);
        expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length);

        // finale is a boss from the right pool, mains are non-boss
        const boss = deck[deck.length - 1];
        expect(boss.boss).toBe(true);
        expect(bossPool.has(boss.id)).toBe(true);
        const mains = deck.slice(0, SESSION_LENGTH);
        for (const card of mains) {
          expect(card.boss ?? false).toBe(false);
          expect(mainPool.has(card.id)).toBe(true);
        }

        // fresh player (nothing seen): the tier mix must follow the level curve
        const shape = sessionShape(level);
        const byTier = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;
        for (const card of mains) byTier[card.tier] += 1;
        expect(byTier).toEqual(shape);
      }
    });

    it(`never leaks the other region's cards into ${country} decks`, () => {
      const other = country === "us" ? "in" : "us";
      for (let seed = 1; seed <= 30; seed++) {
        const deck = createSession(mulberry32(seed), new Set(), country, ((seed * 3) % 50) + 1);
        for (const card of deck) {
          expect(card.region ?? "global").not.toBe(other);
        }
      }
    });

    it(`unseen-first dealing eventually covers the whole ${country} main pool`, () => {
      const universe = new Set(eligible(CARDS, country).map((c) => c.id));
      const seen = new Set<string>();
      const dealt = new Set<string>();
      // generous ceiling: pool/12 runs would be perfect coverage; allow 3x
      const maxRuns = Math.ceil((universe.size / SESSION_LENGTH) * 3);
      for (let run = 0; run < maxRuns && dealt.size < universe.size; run++) {
        const deck = createSession(mulberry32(1000 + run), seen, country, (run % 50) + 1);
        for (const card of deck.slice(0, SESSION_LENGTH)) {
          dealt.add(card.id);
          seen.add(card.id);
        }
      }
      expect(dealt.size).toBe(universe.size);
    });
  }
});
