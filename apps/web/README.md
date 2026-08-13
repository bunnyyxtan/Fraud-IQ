# Fraud IQ

**Scam spotting as a daily game.** A mobile-width web game that trains the one financial reflex nobody teaches: telling a real message from a fake one, in fifteen seconds, under pressure.

Built for Hackonomics 2027.

| | |
|---|---|
| **Play** | **[fraudiq-production.up.railway.app](https://fraudiq-production.up.railway.app)** |
| **Demo film** | **[youtu.be/m8CheNzK-bY](https://youtu.be/m8CheNzK-bY)** |
| **Source** | this repository |

|  |  |  |
|:--:|:--:|:--:|
| <img src="screenshots/01-home.png" width="240" alt="Fraud IQ home screen with a live intercepted scam text and the play button"> | <img src="screenshots/02-case.png" width="240" alt="A case in play: an SMS offering $500 weekly for a car wrap, with SCAM and LEGIT buttons"> | <img src="screenshots/03-verdict.png" width="240" alt="The reveal screen explaining why the message was a scam"> |
| Pick a region, take the daily | One message, fifteen seconds | Then the game shows you the tells |

---

## The problem, in money

Fraud is not an edge case anymore, it is a line item. US consumers reported **$12.5B** lost to fraud in 2024 (FTC Consumer Sentinel Network). India reported **₹22,845 crore** in cyber-fraud losses (Ministry of Home Affairs, Lok Sabha reply, 2025).

Financial literacy education spends its time on budgeting, compounding and credit scores. All of that assumes the money reaches the right person. Scam recognition is the layer underneath every other financial skill, and it is almost never taught, because it cannot be taught as a list of rules. Scammers change the rules weekly.

The only thing that transfers is **pattern exposure at speed**. That is what this game is.

## How a run plays

A run is a 13-case gauntlet: twelve cards drawn from the main pool, then a boss finale that scores double. Each case shows one artifact, rendered to look like the real thing: an SMS, an email, a payment request, a DM, an ad, a call screen or a browser popup.

You get three lives and fifteen seconds a case. Call it **SCAM** or **LEGIT** before the timer runs out.

On reveal, the game highlights the exact tells inside the message: the lookalike domain, the urgency clause, the payment rail that cannot be reversed. Legit cards explain their green flags too, because a trainer that only ever shows fraud teaches paranoia, not judgement.

Two things make it stick:

- **One daily gauntlet, same deck for everyone**, flipping at midnight US Eastern. Comparable scores, a real leaderboard, a reason to come back tomorrow.
- **Every run is priced.** The scoreboard is in dollars, not points.

## The part that makes it economics

Most quiz games stop at right and wrong. This one converts your session into money, then charges you in both directions.

|  |  |
|:--:|:--|
| <img src="screenshots/06-economics.png" width="250" alt="Results screen showing money lost, money saved, and the price of being wrong card"> | The results screen tallies the money you **saved** by catching scams and the money you **lost** by trusting them, using a realistic loss amount attached to each individual scam card.<br><br>Then "The price of being wrong" splits the cost of trusting from the cost of over-suspicion. Over-caution has a price too: people who flag everything miss real refunds, real delivery notices, real bank alerts.<br><br>Scoring both directions is what makes this a financial-decision trainer rather than a fear machine. |

## How scoring works

|  |  |
|:--:|:--|
| <img src="screenshots/05-results.png" width="250" alt="Final score screen with accuracy, best streak and a per-category threat detection breakdown"> | <table><tr><td>Cases per run</td><td>13 (12 + boss)</td></tr><tr><td>Lives</td><td>3</td></tr><tr><td>Timer per case</td><td>15s</td></tr><tr><td>Correct call</td><td>100 pts</td></tr><tr><td>Speed bonus</td><td>up to 50</td></tr><tr><td>Streak bonus</td><td>10 each, cap 100</td></tr><tr><td>Boss round</td><td>2x</td></tr><tr><td>Level ceiling</td><td>50</td></tr></table> |

Difficulty is banded by player level: early levels draw more tier-1 cards, later levels shift the mix toward tier-3, so the deck sharpens as the player does. The results screen also breaks accuracy down by threat category, so you can see the specific scam type that keeps getting you.

## What you take away from it

|  |  |
|:--:|:--|
| <img src="screenshots/04-intel.png" width="250" alt="A collectible intel card citing an FTC statistic about online shopping scams"> | Between cases the game drops **intel files**: single-fact cards pulled from real fraud reporting, collected into a shelf on your profile.<br><br>Every one of the 34 stats carries an explicit source and year on the card itself. A test asserts that every single one cites a source, so an uncited stat fails the build rather than shipping quietly.<br><br>This is the part that survives the session. You forget your score; you remember that gift cards are never a real payment method. |

## The ledger

|  |  |
|:--:|:--|
| <img src="screenshots/07-ranks.png" width="250" alt="Leaderboard screen showing ranked players with scores"> | Finish a run, sign it, and your score enters the ledger. Daily and all-time boards run side by side.<br><br>Because the daily gauntlet deals the same deck to everyone, daily positions are actually comparable, which is the whole reason the mode exists.<br><br>A leaderboard is only interesting if the numbers are real, so every submission is screened server-side. See [anti-cheat](#anti-cheat). |

## Where the content comes from

This is the part worth scrutinising, so it is documented rather than claimed.

**187 cases: 118 scams, 69 legitimate, across 33 categories.** That is 171 in the main pool plus 16 boss cards reserved for the double-points round. Regional split: 80 US, 50 India, 57 region-neutral.

No player ever sees the whole pool. The dealer serves the region-neutral cards plus the player's own country, so **a US player draws from 137 cases and an India player from 107**. That is deliberate: a US player should never be tested on a UPI collect request, and an India player should not be graded on FAFSA.

- **No case is AI-generated.** Every card is handwritten from real reported fraud patterns: FTC and IC3 case types, bank and postal service advisories, platform trust-and-safety writeups, and India-specific rails like UPI collect requests, fake KYC re-verification and the digital-arrest scam.
- **Scam cards carry structured `tells`.** Each tell's `span` is written as a literal substring of the card's own sender or body text, and the highlighter matches it literally, so the reveal marks up the real words rather than a paraphrase of them.
- **Legit cards carry a `legitNote`** naming the green flags and what a careful person would still verify independently.
- **Scam cards carry a `lossAmount`**, the realistic loss if you fall for that specific case, sized against typical FTC and IC3 reported amounts. This is what drives the money tally; cards without one count as zero.
- **34 intel stats**, unlocked as collectible cards between runs, each carrying an explicit source and year.

Categories span phishing, banking, UPI, KYC, digital arrest, delivery, toll, government, job offers, marketplace, romance, crypto, investment, AI voice cloning, tech support, gaming currency, school and campus scams, subscriptions, travel, tickets, charity, blackmail and utilities.

## Architecture

A React SPA with a thin Express API. The game itself is fully playable offline as a guest; the backend exists only for identity, score persistence and the leaderboard.

```
artifacts/hackonomics/          web app (this folder)
  src/
    pages/Home.tsx              run orchestration and screen routing
    components/game/
      StartScreen.tsx           region pick, daily state, run entry
      PlayScreen.tsx            the round loop: card, timer, verdict, reveal
      ResultsScreen.tsx         score, money tally, economics card, share, claim
      LeaderboardScreen.tsx     daily and all-time boards
      ProfileScreen.tsx         level, streaks, category accuracy, intel shelf
      CardDisplay.tsx           renders all seven artifact types
      HighlightedText.tsx       span-accurate tell highlighting
      IntelCard.tsx             collectible stat cards
    data/
      cards.ts                  the 187-case pool, typed and tiered
      intel.ts                  34 sourced stats + national loss figures
    lib/
      game.ts                   pure game logic: session build, scoring,
                                levels, persistence, share text
      api.ts                    typed client for the backend
      ui.tsx                    design tokens
      sound.ts                  WebAudio feedback

artifacts/api-server/
  src/routes/fraudIq.ts         players, scores, leaderboard, anti-cheat

lib/db/src/schema/fraudIq.ts    Drizzle schema
```

**Everything scoring-related lives in pure functions in `src/lib/game.ts`.** Screens render, they do not compute. That is what makes the logic testable without a browser.

### Data model

- `fraud_iq_players` · id, display name, avatar id, opaque token
- `fraud_iq_scores` · one row per completed run: score, accuracy, best streak, money saved and lost, radar level, mode (`classic` or `daily`), a client-generated run id, and the server-set US Eastern date

Two partial unique indexes carry the integrity rules that would otherwise need application locking:

- `(player_id, run_id)` where run id is not null, which makes submission **idempotent**: a retried or double-fired request cannot inflate a leaderboard
- `(player_id, run_date)` where mode is `daily`, which enforces **one daily-gauntlet score per player per day** at the database level, not in a race-prone check-then-insert

The date key is computed server-side from `America/New_York`, so a player cannot farm extra daily attempts by changing their device clock or timezone.

### API

```
POST   /fraud-iq/players          create a player, returns an opaque token
PATCH  /fraud-iq/players/name     rename
PATCH  /fraud-iq/players/avatar   change avatar
POST   /fraud-iq/scores           submit a finished run
GET    /fraud-iq/me               own profile and aggregates
GET    /fraud-iq/leaderboard      daily and all-time boards
```

Routes are mounted under `/api`. A player is identified by an opaque token issued at creation. It travels in the request body on writes and as a query parameter on the read endpoint, and it is compared with `crypto.timingSafeEqual`, never with plain string equality. Every request body is validated with Zod at the boundary.

### Anti-cheat

Every submission is screened server-side in three layers.

**1. Shape.** The Zod body schema bounds every field: score, accuracy, best streak and both money figures have hard ceilings, and the radar level must be one of the known names.

**2. Impossible states.** `isImpossibleRun()` is a pure function rejecting runs the game cannot physically produce:

- a positive score with zero accuracy or zero best streak
- money saved above zero on a zero score
- total money handled above `MAX_MONEY_PER_RUN` (37,400), which exceeds the richest deck the dealer can build

Because it is pure and exported, each of these rules is unit-tested with no database in the loop.

**3. Route and database guards.** Submissions less than 10 seconds apart are rejected, since no real 13-case session finishes that fast even after losing every life. Beyond that, the uniqueness rules above are enforced by the database rather than by application checks.

### Sharing

Finishing a run produces a Wordle-style share block: a dot grid of hits and misses, the score, the money saved, and a link built at runtime from the app's own origin, so it stays correct in dev and in production without a hardcoded URL.

## Accessibility

Treated as a requirement, not a polish pass. A fraud trainer that excludes older or low-vision users excludes the people most targeted by fraud.

- Landmark structure on every screen, one `main` per view, labelled navigation
- Verdict results announced through an assertive live region; round progress through a polite one
- The countdown number is hidden from screen readers and replaced with a coarse spoken bucket, so the timer informs without machine-gunning the announcement queue
- The quit confirmation is a real dialog: `aria-modal`, Tab cycled inside it, focus handed back to whatever opened it on close, and keystrokes cannot leak through to the game behind it
- The boss-round takeover is dismissed by tapping anywhere, so it is marked `aria-modal` and carries a full spoken label describing what it is and how to continue
- Visible focus rings on every interactive element, all buttons and inputs named
- Text contrast meets WCAG AA
- `prefers-reduced-motion` honoured across animations

## Testing

**66 tests, all green.**

- 41 in the web app: session construction and deck banding, scoring maths, streaks, level curve, persistence round-trips, share formatting, intel selection, and the "every intel stat cites a source" provenance guard
- 25 in the API: anti-cheat rules, score submission validation, the ET date-key rollover, and leaderboard shaping

```bash
pnpm --filter @workspace/hackonomics run test
pnpm --filter @workspace/api-server run test
pnpm run typecheck        # all packages
```

## Running locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev     # API
pnpm --filter @workspace/hackonomics run dev    # web app
```

The web app needs no backend to play as a guest. The API needs `DATABASE_URL` pointing at a Postgres instance; push the schema with `pnpm --filter @workspace/db run push`.

## Stack

React, TypeScript, Vite, Tailwind, Framer Motion, wouter, TanStack Query on the front end. Express 5, Drizzle ORM, PostgreSQL and Zod on the back end. Vitest for tests. Node 24, pnpm workspaces.

No AI is called at runtime. The game is deterministic, offline-capable and cheap to serve, which is the point: a fraud trainer that costs a fraction of a cent per player can actually be deployed at the scale the problem has.
