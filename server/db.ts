import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, profiles, analyses, subscriptions, usageLogs, InsertProfile, InsertAnalysis, InsertSubscription, InsertUsageLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Profile helpers
export async function getOrCreateProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }

  // Create new profile
  await db.insert(profiles).values({
    userId,
    subscriptionStatus: "free",
    analysisCount: 0,
  });

  const newProfile = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return newProfile[0] || null;
}

export async function updateProfile(userId: number, data: Partial<InsertProfile>) {
  const db = await getDb();
  if (!db) return null;

  await db.update(profiles).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(profiles.userId, userId));

  return getOrCreateProfile(userId);
}

export async function incrementAnalysisCount(userId: number) {
  const db = await getDb();
  if (!db) return;

  const profile = await getOrCreateProfile(userId);
  if (profile) {
    await db.update(profiles).set({
      analysisCount: (profile.analysisCount || 0) + 1,
      updatedAt: new Date(),
    }).where(eq(profiles.userId, userId));
  }
}

// Analysis helpers
export async function createAnalysis(data: InsertAnalysis) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(analyses).values(data);
  const insertId = Number(result[0].insertId);
  
  const newAnalysis = await db.select().from(analyses).where(eq(analyses.id, insertId)).limit(1);
  return newAnalysis[0] || null;
}

export async function getUserAnalyses(userId: number, limit?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(analyses).where(eq(analyses.userId, userId)).orderBy(desc(analyses.createdAt));
  
  if (limit) {
    query = query.limit(limit) as any;
  }

  return query;
}

export async function getAnalysisById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
  return result[0] || null;
}

export async function deleteAnalysis(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  // Verify ownership
  const analysis = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
  if (!analysis[0] || analysis[0].userId !== userId) {
    return false;
  }

  await db.delete(analyses).where(eq(analyses.id, id));
  return true;
}

// Subscription helpers
export async function getSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result[0] || null;
}

export async function upsertSubscription(data: InsertSubscription) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, data.userId)).limit(1);

  if (existing.length > 0) {
    await db.update(subscriptions).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(subscriptions.userId, data.userId));
  } else {
    await db.insert(subscriptions).values(data);
  }

  return getSubscription(data.userId);
}

// Usage log helpers
export async function logUsage(data: InsertUsageLog) {
  const db = await getDb();
  if (!db) return;

  await db.insert(usageLogs).values(data);
}

// Check if user has active premium subscription
export async function hasActivePremium(userId: number): Promise<boolean> {
  const profile = await getOrCreateProfile(userId);
  if (!profile) return false;

  if (profile.subscriptionStatus !== "active") return false;

  // Check if subscription has expired
  if (profile.subscriptionEndsAt && profile.subscriptionEndsAt < new Date()) {
    // Update status to expired
    await updateProfile(userId, { subscriptionStatus: "free" });
    return false;
  }

  return true;
}
