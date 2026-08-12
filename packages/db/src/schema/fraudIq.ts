import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fraudIqPlayers = pgTable("fraud_iq_players", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 24 }).notNull(),
  token: varchar("token", { length: 64 }).notNull(),
  /** chosen avatar id from the shared client/server allowlist; null = deterministic default */
  avatar: varchar("avatar", { length: 16 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const fraudIqScores = pgTable(
  "fraud_iq_scores",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => fraudIqPlayers.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    accuracy: integer("accuracy").notNull(),
    bestStreak: integer("best_streak").notNull(),
    moneySaved: integer("money_saved").notNull(),
    moneyLost: integer("money_lost").notNull(),
    radarLevel: text("radar_level").notNull(),
    gameOver: boolean("game_over").notNull().default(false),
    /** client-generated id for a completed run; makes submission idempotent */
    runId: varchar("run_id", { length: 40 }),
    /** 'classic' free play or the date-seeded 'daily' gauntlet */
    mode: text("mode").notNull().default("classic"),
    /** server-set US Eastern date (YYYY-MM-DD) the run was submitted on */
    runDate: varchar("run_date", { length: 10 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("fraud_iq_scores_player_idx").on(t.playerId),
    index("fraud_iq_scores_score_idx").on(t.score),
    index("fraud_iq_scores_daily_idx").on(t.mode, t.runDate),
    uniqueIndex("fraud_iq_scores_run_uniq")
      .on(t.playerId, t.runId)
      .where(sql`${t.runId} is not null`),
    /** one accepted daily-gauntlet score per player per ET date */
    uniqueIndex("fraud_iq_scores_daily_uniq")
      .on(t.playerId, t.runDate)
      .where(sql`${t.mode} = 'daily'`),
  ],
);

export const insertFraudIqPlayerSchema = createInsertSchema(
  fraudIqPlayers,
).omit({ id: true, createdAt: true });
export const insertFraudIqScoreSchema = createInsertSchema(fraudIqScores).omit(
  { id: true, createdAt: true },
);

export type FraudIqPlayer = typeof fraudIqPlayers.$inferSelect;
export type InsertFraudIqPlayer = z.infer<typeof insertFraudIqPlayerSchema>;
export type FraudIqScore = typeof fraudIqScores.$inferSelect;
export type InsertFraudIqScore = z.infer<typeof insertFraudIqScoreSchema>;
