var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
import { createClient } from "@supabase/supabase-js";
function getSupabase() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) {
    console.warn("[Database] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY not set");
    return null;
  }
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const supabase = getSupabase();
  if (!supabase) {
    console.warn("[Database] Cannot upsert user: supabase client not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const textFields = ["name", "email", "loginMethod"];
    textFields.forEach((field) => {
      const v = user[field];
      if (v !== void 0) values[field] = v ?? null;
    });
    if (user.lastSignedIn !== void 0) values.lastSignedIn = user.lastSignedIn;
    if (user.role !== void 0) values.role = user.role;
    else if (user.openId === ENV.ownerOpenId) values.role = "admin";
    if (!values.lastSignedIn) values.lastSignedIn = (/* @__PURE__ */ new Date()).toISOString();
    const { error } = await supabase.from("users").upsert(values, { onConflict: "openId" });
    if (error) {
      console.error("[Database] Failed to upsert user:", error.message);
      throw error;
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn("[Database] Cannot get user: supabase client not available");
    return void 0;
  }
  const { data, error } = await supabase.from("users").select("*").eq("openId", openId).limit(1).maybeSingle();
  if (error) {
    console.error("[Database] getUserByOpenId error:", error.message);
    return void 0;
  }
  return data || void 0;
}
async function getOrCreateProfile(userId) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: existing, error: selectError } = await supabase.from("profiles").select("*").eq("userId", userId).limit(1).maybeSingle();
  if (selectError) {
    console.error("[Database] getOrCreateProfile select error:", selectError.message);
    return null;
  }
  if (existing) return existing;
  const { data: inserted, error: insertError } = await supabase.from("profiles").insert({
    userId,
    subscriptionStatus: "free",
    analysisCount: 0
  }).select().maybeSingle();
  if (insertError) {
    console.error("[Database] getOrCreateProfile insert error:", insertError.message);
    return null;
  }
  return inserted || null;
}
async function updateProfile(userId, data) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { error } = await supabase.from("profiles").update({
    ...data,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("userId", userId);
  if (error) {
    console.error("[Database] updateProfile error:", error.message);
    return null;
  }
  return getOrCreateProfile(userId);
}
async function incrementAnalysisCount(userId) {
  const supabase = getSupabase();
  if (!supabase) return;
  const profile = await getOrCreateProfile(userId);
  if (profile) {
    const { error } = await supabase.from("profiles").update({
      analysisCount: (profile.analysisCount || 0) + 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("userId", userId);
    if (error) console.error("[Database] incrementAnalysisCount error:", error.message);
  }
}
async function createAnalysis(data) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { error } = await supabase.from("analyses").insert(data);
  if (error) {
    console.error("[Database] createAnalysis error:", error.message);
    return null;
  }
  return data;
}
async function getUserAnalyses(userId, limit) {
  const supabase = getSupabase();
  if (!supabase) return [];
  let q = supabase.from("analyses").select("*").eq("userId", userId).order("createdAt", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) {
    console.error("[Database] getUserAnalyses error:", error.message);
    return [];
  }
  return data || [];
}
async function getAnalysisById(id) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("analyses").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[Database] getAnalysisById error:", error.message);
    return null;
  }
  return data || null;
}
async function deleteAnalysis(id, userId) {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data: analysis, error: selectError } = await supabase.from("analyses").select("*").eq("id", id).maybeSingle();
  if (selectError) {
    console.error("[Database] deleteAnalysis select error:", selectError.message);
    return false;
  }
  if (!analysis || analysis.userId !== userId) return false;
  const { error } = await supabase.from("analyses").delete().eq("id", id);
  if (error) {
    console.error("[Database] deleteAnalysis error:", error.message);
    return false;
  }
  return true;
}
async function getSubscription(userId) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("subscriptions").select("*").eq("userId", userId).maybeSingle();
  if (error) {
    console.error("[Database] getSubscription error:", error.message);
    return null;
  }
  return data || null;
}
async function upsertSubscription(data) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const payload = {
    ...data,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const { error } = await supabase.from("subscriptions").upsert(payload, { onConflict: "userId" });
  if (error) {
    console.error("[Database] upsertSubscription error:", error.message);
    return null;
  }
  return getSubscription(data.userId);
}
async function logUsage(data) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("usageLogs").insert(data);
  if (error) {
    console.error("[Database] logUsage error:", error.message);
  }
}
var _supabase;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_env();
    _supabase = null;
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  storageGet: () => storageGet,
  storagePut: () => storagePut
});
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
async function buildDownloadUrl(baseUrl, relKey, apiKey) {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey)
  });
  return (await response.json()).url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}
async function storageGet(relKey) {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey)
  };
}
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_env();
  }
});

// server/_core/llm.ts
var llm_exports = {};
__export(llm_exports, {
  invokeLLM: () => invokeLLM
});
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}
var ensureArray, normalizeContentPart, normalizeMessage, normalizeToolChoice, resolveApiUrl, assertApiKey, normalizeResponseFormat;
var init_llm = __esm({
  "server/_core/llm.ts"() {
    "use strict";
    init_env();
    ensureArray = (value) => Array.isArray(value) ? value : [value];
    normalizeContentPart = (part) => {
      if (typeof part === "string") {
        return { type: "text", text: part };
      }
      if (part.type === "text") {
        return part;
      }
      if (part.type === "image_url") {
        return part;
      }
      if (part.type === "file_url") {
        return part;
      }
      throw new Error("Unsupported message content part");
    };
    normalizeMessage = (message) => {
      const { role, name, tool_call_id } = message;
      if (role === "tool" || role === "function") {
        const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
        return {
          role,
          name,
          tool_call_id,
          content
        };
      }
      const contentParts = ensureArray(message.content).map(normalizeContentPart);
      if (contentParts.length === 1 && contentParts[0].type === "text") {
        return {
          role,
          name,
          content: contentParts[0].text
        };
      }
      return {
        role,
        name,
        content: contentParts
      };
    };
    normalizeToolChoice = (toolChoice, tools) => {
      if (!toolChoice) return void 0;
      if (toolChoice === "none" || toolChoice === "auto") {
        return toolChoice;
      }
      if (toolChoice === "required") {
        if (!tools || tools.length === 0) {
          throw new Error(
            "tool_choice 'required' was provided but no tools were configured"
          );
        }
        if (tools.length > 1) {
          throw new Error(
            "tool_choice 'required' needs a single tool or specify the tool name explicitly"
          );
        }
        return {
          type: "function",
          function: { name: tools[0].function.name }
        };
      }
      if ("name" in toolChoice) {
        return {
          type: "function",
          function: { name: toolChoice.name }
        };
      }
      return toolChoice;
    };
    resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
    assertApiKey = () => {
      if (!ENV.forgeApiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }
    };
    normalizeResponseFormat = ({
      responseFormat,
      response_format,
      outputSchema,
      output_schema
    }) => {
      const explicitFormat = responseFormat || response_format;
      if (explicitFormat) {
        if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
          throw new Error(
            "responseFormat json_schema requires a defined schema object"
          );
        }
        return explicitFormat;
      }
      const schema = outputSchema || output_schema;
      if (!schema) return void 0;
      if (!schema.name || !schema.schema) {
        throw new Error("outputSchema requires both name and schema");
      }
      return {
        type: "json_schema",
        json_schema: {
          name: schema.name,
          schema: schema.schema,
          ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
        }
      };
    };
  }
});

// server/products.ts
var products_exports = {};
__export(products_exports, {
  PRODUCTS: () => PRODUCTS
});
var PRODUCTS;
var init_products = __esm({
  "server/products.ts"() {
    "use strict";
    PRODUCTS = {
      WEEKLY: {
        name: "W-AI Premium - Weekly",
        priceId: process.env.STRIPE_PRICE_WEEKLY || "price_weekly",
        amount: 799,
        // $7.99
        currency: "usd",
        interval: "week"
      },
      YEARLY: {
        name: "W-AI Premium - Yearly",
        priceId: process.env.STRIPE_PRICE_YEARLY || "price_yearly",
        amount: 3999,
        // $39.99
        currency: "usd",
        interval: "year"
      }
    };
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  analyses: () => analyses,
  profiles: () => profiles,
  subscriptions: () => subscriptions,
  usageLogs: () => usageLogs,
  users: () => users
});
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";
var users, profiles, analyses, subscriptions, usageLogs;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    profiles = mysqlTable("profiles", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      subscriptionStatus: varchar("subscriptionStatus", { length: 50 }).default("free").notNull(),
      subscriptionPlan: varchar("subscriptionPlan", { length: 50 }),
      subscriptionEndsAt: timestamp("subscriptionEndsAt"),
      analysisCount: int("analysisCount").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    analyses = mysqlTable("analyses", {
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
      patterns: json("patterns").$type(),
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
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    subscriptions = mysqlTable("subscriptions", {
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
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    usageLogs = mysqlTable("usageLogs", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      action: varchar("action", { length: 100 }).notNull(),
      metadata: json("metadata"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/stripe-webhook.ts
var stripe_webhook_exports = {};
__export(stripe_webhook_exports, {
  handleStripeWebhook: () => handleStripeWebhook
});
import Stripe from "stripe";
async function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).send("No signature");
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true
    });
  }
  console.log(`[Stripe Webhook] Received event: ${event.type}`);
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.user_id;
        const customerEmail = session.customer_email || session.metadata?.customer_email;
        if (!userId) {
          console.error("[Webhook] No user ID in checkout session");
          break;
        }
        const numericUserId = parseInt(userId);
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await updateProfile(numericUserId, {
            subscriptionStatus: "active",
            subscriptionPlan: subscription.items.data[0]?.price.recurring?.interval || "unknown",
            subscriptionEndsAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1e3) : null
          });
          await upsertSubscription({
            userId: numericUserId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: subscription.items.data[0]?.price.recurring?.interval || "unknown",
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1e3) : /* @__PURE__ */ new Date(),
            currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1e3) : /* @__PURE__ */ new Date(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          });
          console.log(`[Webhook] Subscription activated for user ${userId}`);
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const existingSub = await (void 0)().then(async (dbInstance) => {
          if (!dbInstance) return null;
          const { subscriptions: subscriptions2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          const { eq } = await import("drizzle-orm");
          const result = await dbInstance.select().from(subscriptions2).where(eq(subscriptions2.stripeCustomerId, customerId)).limit(1);
          return result[0] || null;
        });
        if (existingSub) {
          await updateProfile(existingSub.userId, {
            subscriptionStatus: subscription.status === "active" ? "active" : "free",
            subscriptionEndsAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1e3) : null
          });
          await upsertSubscription({
            userId: existingSub.userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            plan: subscription.items.data[0]?.price.recurring?.interval || "unknown",
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1e3) : /* @__PURE__ */ new Date(),
            currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1e3) : /* @__PURE__ */ new Date(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          });
          console.log(`[Webhook] Subscription updated for user ${existingSub.userId}`);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const existingSub = await (void 0)().then(async (dbInstance) => {
          if (!dbInstance) return null;
          const { subscriptions: subscriptions2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          const { eq } = await import("drizzle-orm");
          const result = await dbInstance.select().from(subscriptions2).where(eq(subscriptions2.stripeCustomerId, customerId)).limit(1);
          return result[0] || null;
        });
        if (existingSub) {
          await updateProfile(existingSub.userId, {
            subscriptionStatus: "free",
            subscriptionEndsAt: null
          });
          console.log(`[Webhook] Subscription cancelled for user ${existingSub.userId}`);
        }
        break;
      }
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
var stripe;
var init_stripe_webhook = __esm({
  "server/stripe-webhook.ts"() {
    "use strict";
    init_db();
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2025-10-29.clover"
    });
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";
var premiumProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const hasPremium = await (void 0)(ctx.user.id);
  return next({
    ctx: {
      ...ctx,
      hasPremium
    }
  });
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const profile = await getOrCreateProfile(ctx.user.id);
      return {
        ...ctx.user,
        profile
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getOrCreateProfile(ctx.user.id);
    }),
    update: protectedProcedure.input(z2.object({
      subscriptionStatus: z2.string().optional(),
      subscriptionPlan: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return updateProfile(ctx.user.id, input);
    })
  }),
  analysis: router({
    create: protectedProcedure.input(z2.object({
      imageUrl: z2.string(),
      thumbnailUrl: z2.string().optional(),
      assetName: z2.string().optional(),
      timeframe: z2.string().optional(),
      trend: z2.string().optional(),
      confidence: z2.number().optional(),
      rsiValue: z2.number().optional(),
      rsiStatus: z2.string().optional(),
      macdSignal: z2.string().optional(),
      maStatus: z2.string().optional(),
      patterns: z2.array(z2.string()).optional(),
      buyZoneMin: z2.string().optional(),
      buyZoneMax: z2.string().optional(),
      stopLoss: z2.string().optional(),
      takeProfit1: z2.string().optional(),
      takeProfit2: z2.string().optional(),
      riskReward: z2.string().optional(),
      riskLevel: z2.string().optional(),
      volatility: z2.string().optional(),
      trendStrength: z2.number().optional(),
      analysisRaw: z2.any().optional()
    })).mutation(async ({ ctx, input }) => {
      const analysis = await createAnalysis({
        userId: ctx.user.id,
        ...input
      });
      await incrementAnalysisCount(ctx.user.id);
      await logUsage({
        userId: ctx.user.id,
        action: "ANALYSIS_CREATED",
        metadata: { analysisId: analysis?.id }
      });
      return analysis;
    }),
    list: premiumProcedure.query(async ({ ctx }) => {
      const limit = ctx.hasPremium ? void 0 : 3;
      return getUserAnalyses(ctx.user.id, limit);
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
      const analysis = await getAnalysisById(input.id);
      if (!analysis) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Analysis not found"
        });
      }
      if (analysis.userId !== ctx.user.id) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Not authorized to view this analysis"
        });
      }
      return analysis;
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      const success = await deleteAnalysis(input.id, ctx.user.id);
      if (!success) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Not authorized to delete this analysis"
        });
      }
      return { success };
    })
  }),
  analyze: router({
    image: protectedProcedure.input(z2.object({
      imageBase64: z2.string(),
      assetName: z2.string(),
      strategy: z2.string()
    })).mutation(async ({ ctx, input }) => {
      const { imageBase64, assetName, strategy } = input;
      const profile = await getOrCreateProfile(ctx.user.id);
      const hasPremium = await (void 0)(ctx.user.id);
      if (!hasPremium && (profile?.analysisCount || 0) >= 3) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Free tier limit reached. Please upgrade to continue."
        });
      }
      const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const imageBuffer = Buffer.from(imageBase64.split(",")[1], "base64");
      const imageKey = `analyses/${ctx.user.id}/${Date.now()}.png`;
      const { url: imageUrl } = await storagePut2(imageKey, imageBuffer, "image/png");
      const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
      const prompt = `You are an expert trading analyst. Analyze this trading chart image and provide detailed technical analysis.

Asset: ${assetName}
Strategy: ${strategy}

Provide your analysis in the following JSON format:
{
  "trend": "bullish" or "bearish",
  "confidence": number (0-100),
  "rsiValue": number (0-100),
  "rsiStatus": "oversold", "neutral", or "overbought",
  "macdSignal": "bullish_crossover", "bearish_crossover", or "neutral",
  "maStatus": "MA10 < MA30 < MA60" or similar,
  "patterns": ["pattern1", "pattern2"],
  "buyZoneMin": "price",
  "buyZoneMax": "price",
  "stopLoss": "price",
  "takeProfit1": "price",
  "takeProfit2": "price",
  "riskReward": "1:2",
  "riskLevel": "low", "medium", or "high",
  "volatility": "low", "medium", or "high",
  "trendStrength": number (0-100)
}`;
      const response = await invokeLLM2({
        messages: [
          { role: "system", content: "You are a professional trading analyst." },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "trading_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                trend: { type: "string" },
                confidence: { type: "number" },
                rsiValue: { type: "number" },
                rsiStatus: { type: "string" },
                macdSignal: { type: "string" },
                maStatus: { type: "string" },
                patterns: { type: "array", items: { type: "string" } },
                buyZoneMin: { type: "string" },
                buyZoneMax: { type: "string" },
                stopLoss: { type: "string" },
                takeProfit1: { type: "string" },
                takeProfit2: { type: "string" },
                riskReward: { type: "string" },
                riskLevel: { type: "string" },
                volatility: { type: "string" },
                trendStrength: { type: "number" }
              },
              required: ["trend", "confidence"],
              additionalProperties: false
            }
          }
        }
      });
      const analysisData = JSON.parse(response.choices[0].message.content || "{}");
      const analysis = await createAnalysis({
        userId: ctx.user.id,
        imageUrl,
        thumbnailUrl: imageUrl,
        assetName,
        timeframe: strategy,
        trend: analysisData.trend,
        confidence: analysisData.confidence,
        rsiValue: analysisData.rsiValue,
        rsiStatus: analysisData.rsiStatus,
        macdSignal: analysisData.macdSignal,
        maStatus: analysisData.maStatus,
        patterns: analysisData.patterns,
        buyZoneMin: analysisData.buyZoneMin,
        buyZoneMax: analysisData.buyZoneMax,
        stopLoss: analysisData.stopLoss,
        takeProfit1: analysisData.takeProfit1,
        takeProfit2: analysisData.takeProfit2,
        riskReward: analysisData.riskReward,
        riskLevel: analysisData.riskLevel,
        volatility: analysisData.volatility,
        trendStrength: analysisData.trendStrength,
        analysisRaw: analysisData
      });
      await incrementAnalysisCount(ctx.user.id);
      await logUsage({
        userId: ctx.user.id,
        action: "ANALYSIS_CREATED",
        metadata: { analysisId: analysis?.id }
      });
      return analysis;
    })
  }),
  stripe: router({
    createCheckoutSession: protectedProcedure.input(z2.object({
      plan: z2.enum(["weekly", "yearly"])
    })).mutation(async ({ ctx, input }) => {
      const Stripe2 = (await import("stripe")).default;
      const stripe2 = new Stripe2(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2025-10-29.clover"
      });
      const { PRODUCTS: PRODUCTS2 } = await Promise.resolve().then(() => (init_products(), products_exports));
      const product = input.plan === "weekly" ? PRODUCTS2.WEEKLY : PRODUCTS2.YEARLY;
      const origin = ctx.req.headers.origin || "http://localhost:3000";
      const session = await stripe2.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: product.priceId,
            quantity: 1
          }
        ],
        success_url: `${origin}/home?success=true`,
        cancel_url: `${origin}/subscribe?canceled=true`,
        customer_email: ctx.user.email || void 0,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || ""
        },
        allow_promotion_codes: true
      });
      return {
        url: session.url
      };
    })
  }),
  subscription: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getSubscription(ctx.user.id);
    }),
    checkPremium: protectedProcedure.query(async ({ ctx }) => {
      const hasPremium = await (void 0)(ctx.user.id);
      const profile = await getOrCreateProfile(ctx.user.id);
      return {
        hasPremium,
        status: profile?.subscriptionStatus || "free",
        plan: profile?.subscriptionPlan,
        endsAt: profile?.subscriptionEndsAt
      };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.post("/api/stripe/webhook", express2.raw({ type: "application/json" }), async (req, res) => {
    const { handleStripeWebhook: handleStripeWebhook2 } = await Promise.resolve().then(() => (init_stripe_webhook(), stripe_webhook_exports));
    return handleStripeWebhook2(req, res);
  });
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
