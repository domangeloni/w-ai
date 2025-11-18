import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Extended user profiles with subscription information
 */
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionStatus: varchar("subscriptionStatus", { length: 50 }).default("free").notNull(),
  subscriptionPlan: varchar("subscriptionPlan", { length: 50 }),
  subscriptionEndsAt: timestamp("subscriptionEndsAt"),
  analysisCount: int("analysisCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/**
 * Chart analyses performed by users
 */
export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  imageUrl: text("imageUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  assetName: varchar("assetName", { length: 100 }),
  timeframe: varchar("timeframe", { length: 50 }),
  
  // Basic results (free)
  trend: varchar("trend", { length: 50 }),
  confidence: int("confidence"),
  
  // Technical indicators (free)
  rsiValue: int("rsiValue"),
  rsiStatus: varchar("rsiStatus", { length: 50 }),
  macdSignal: varchar("macdSignal", { length: 100 }),
  maStatus: varchar("maStatus", { length: 100 }),
  patterns: json("patterns").$type<string[]>(),
  
  // Trading signals (premium)
  buyZoneMin: varchar("buyZoneMin", { length: 50 }),
  buyZoneMax: varchar("buyZoneMax", { length: 50 }),
  stopLoss: varchar("stopLoss", { length: 50 }),
  takeProfit1: varchar("takeProfit1", { length: 50 }),
  takeProfit2: varchar("takeProfit2", { length: 50 }),
  riskReward: varchar("riskReward", { length: 50 }),
  
  // Risk analysis (premium)
  riskLevel: varchar("riskLevel", { length: 50 }),
  volatility: varchar("volatility", { length: 50 }),
  trendStrength: int("trendStrength"),
  
  analysisRaw: json("analysisRaw"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

/**
 * Subscription management with Stripe integration
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  plan: varchar("plan", { length: 50 }),
  status: varchar("status", { length: 50 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Usage logs for analytics and auditing
 */
export const usageLogs = mysqlTable("usageLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = typeof usageLogs.$inferInsert;
