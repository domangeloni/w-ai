import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InsertUser, users, profiles, analyses, subscriptions, usageLogs, InsertProfile, InsertAnalysis, InsertSubscription, InsertUsageLog } from "../drizzle/schema";
import { ENV } from './_core/env';

// NOTE: Do NOT hardcode secrets in source. Provide the following env vars at runtime:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY (preferred for server-side operations) or SUPABASE_ANON_KEY

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    console.warn('[Database] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY not set');
    return null;
  }

  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('[Database] Cannot upsert user: supabase client not available');
    return;
  }

  try {
    const values: Record<string, unknown> = {
      openId: user.openId,
    };

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    textFields.forEach((field) => {
      const v = (user as any)[field];
      if (v !== undefined) values[field] = v ?? null;
    });

    if (user.lastSignedIn !== undefined) values.lastSignedIn = user.lastSignedIn;
    if (user.role !== undefined) values.role = user.role;
    else if (user.openId === ENV.ownerOpenId) values.role = 'admin';

    if (!values.lastSignedIn) values.lastSignedIn = new Date().toISOString();

    // Supabase upsert (on conflict by openId)
    const { error } = await supabase.from('users').upsert(values, { onConflict: 'openId' });
    if (error) {
      console.error('[Database] Failed to upsert user:', error.message);
      throw error;
    }
  } catch (error) {
    console.error('[Database] Failed to upsert user:', error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('[Database] Cannot get user: supabase client not available');
    return undefined;
  }

  const { data, error } = await supabase.from('users').select('*').eq('openId', openId).limit(1).maybeSingle();
  if (error) {
    console.error('[Database] getUserByOpenId error:', error.message);
    return undefined;
  }
  return data || undefined;
}

// Profile helpers
export async function getOrCreateProfile(userId: number) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: existing, error: selectError } = await supabase.from('profiles').select('*').eq('userId', userId).limit(1).maybeSingle();
  if (selectError) {
    console.error('[Database] getOrCreateProfile select error:', selectError.message);
    return null;
  }

  if (existing) return existing as any;

  const { data: inserted, error: insertError } = await supabase.from('profiles').insert({
    userId,
    subscriptionStatus: 'free',
    analysisCount: 0,
  }).select().maybeSingle();

  if (insertError) {
    console.error('[Database] getOrCreateProfile insert error:', insertError.message);
    return null;
  }

  return inserted as any || null;
}

export async function updateProfile(userId: number, data: Partial<InsertProfile>) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { error } = await supabase.from('profiles').update({
    ...data,
    updatedAt: new Date().toISOString(),
  }).eq('userId', userId);

  if (error) {
    console.error('[Database] updateProfile error:', error.message);
    return null;
  }

  return getOrCreateProfile(userId);
}

export async function incrementAnalysisCount(userId: number) {
  const supabase = getSupabase();
  if (!supabase) return;

  const profile = await getOrCreateProfile(userId);
  if (profile) {
    const { error } = await supabase.from('profiles').update({
      analysisCount: (profile.analysisCount || 0) + 1,
      updatedAt: new Date().toISOString(),
    }).eq('userId', userId);
    if (error) console.error('[Database] incrementAnalysisCount error:', error.message);
  }
}

// Analysis helpers
export async function createAnalysis(data: InsertAnalysis) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { error } = await supabase.from('analyses').insert(data);
  if (error) {
    console.error('[Database] createAnalysis error:', error.message);
    return null;
  }
  return data; // Return the created analysis data
}

export async function getUserAnalyses(userId: number, limit?: number) {
  const supabase = getSupabase();
  if (!supabase) return [];

  let q = supabase.from('analyses').select('*').eq('userId', userId).order('createdAt', { ascending: false });
  if (limit) q = (q as any).limit(limit);
  const { data, error } = await (q as any);
  if (error) {
    console.error('[Database] getUserAnalyses error:', error.message);
    return [];
  }
  return data || [];
}

export async function getAnalysisById(id: number) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('analyses').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('[Database] getAnalysisById error:', error.message);
    return null;
  }
  return data || null;
}

export async function deleteAnalysis(id: number, userId: number) {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data: analysis, error: selectError } = await supabase.from('analyses').select('*').eq('id', id).maybeSingle();
  if (selectError) {
    console.error('[Database] deleteAnalysis select error:', selectError.message);
    return false;
  }
  if (!analysis || analysis.userId !== userId) return false;

  const { error } = await supabase.from('analyses').delete().eq('id', id);
  if (error) {
    console.error('[Database] deleteAnalysis error:', error.message);
    return false;
  }
  return true;
}

// Subscription helpers
export async function getSubscription(userId: number) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('subscriptions').select('*').eq('userId', userId).maybeSingle();
  if (error) {
    console.error('[Database] getSubscription error:', error.message);
    return null;
  }
  return data || null;
}

export async function upsertSubscription(data: InsertSubscription) {
  const supabase = getSupabase();
  if (!supabase) return null;

  // Use upsert on userId
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
  } as any;

  const { error } = await supabase.from('subscriptions').upsert(payload, { onConflict: 'userId' });
  if (error) {
    console.error('[Database] upsertSubscription error:', error.message);
    return null;
  }

  return getSubscription(data.userId);
}

// Usage log helpers
export async function logUsage(data: InsertUsageLog) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('usageLogs').insert(data);
  if (error) {
    console.error('[Database] logUsage error:', error.message);
  }
}
