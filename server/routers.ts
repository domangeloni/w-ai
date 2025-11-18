import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// Helper procedure that checks for premium access
const premiumProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const hasPremium = await db.hasActivePremium(ctx.user.id);
  return next({
    ctx: {
      ...ctx,
      hasPremium,
    },
  });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      
      // Get or create profile
      const profile = await db.getOrCreateProfile(ctx.user.id);
      
      return {
        ...ctx.user,
        profile,
      };
    }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrCreateProfile(ctx.user.id);
    }),
    
    update: protectedProcedure
      .input(z.object({
        subscriptionStatus: z.string().optional(),
        subscriptionPlan: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updateProfile(ctx.user.id, input);
      }),
  }),

  analysis: router({
    create: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        assetName: z.string().optional(),
        timeframe: z.string().optional(),
        trend: z.string().optional(),
        confidence: z.number().optional(),
        rsiValue: z.number().optional(),
        rsiStatus: z.string().optional(),
        macdSignal: z.string().optional(),
        maStatus: z.string().optional(),
        patterns: z.array(z.string()).optional(),
        buyZoneMin: z.string().optional(),
        buyZoneMax: z.string().optional(),
        stopLoss: z.string().optional(),
        takeProfit1: z.string().optional(),
        takeProfit2: z.string().optional(),
        riskReward: z.string().optional(),
        riskLevel: z.string().optional(),
        volatility: z.string().optional(),
        trendStrength: z.number().optional(),
        analysisRaw: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const analysis = await db.createAnalysis({
          userId: ctx.user.id,
          ...input,
        });
        
        // Increment analysis count
        await db.incrementAnalysisCount(ctx.user.id);
        
        // Log usage
        await db.logUsage({
          userId: ctx.user.id,
          action: "ANALYSIS_CREATED",
          metadata: { analysisId: analysis?.id },
        });
        
        return analysis;
      }),
    
    list: premiumProcedure.query(async ({ ctx }) => {
      // Free users get last 3, premium users get all
      const limit = ctx.hasPremium ? undefined : 3;
      return db.getUserAnalyses(ctx.user.id, limit);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.id);
        
        if (!analysis) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Analysis not found",
          });
        }
        
        if (analysis.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to view this analysis",
          });
        }
        
        return analysis;
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.deleteAnalysis(input.id, ctx.user.id);
        
        if (!success) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to delete this analysis",
          });
        }
        
        return { success };
      }),
  }),

  analyze: router({
    image: protectedProcedure
      .input(z.object({
        imageBase64: z.string(),
        assetName: z.string(),
        strategy: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { imageBase64, assetName, strategy } = input;
        
        // Check if user has reached free tier limit
        const profile = await db.getOrCreateProfile(ctx.user.id);
        const hasPremium = await db.hasActivePremium(ctx.user.id);
        
        if (!hasPremium && (profile?.analysisCount || 0) >= 3) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Free tier limit reached. Please upgrade to continue.",
          });
        }
        
        // Upload image to S3
        const { storagePut } = await import("./storage");
        const imageBuffer = Buffer.from(imageBase64.split(",")[1], "base64");
        const imageKey = `analyses/${ctx.user.id}/${Date.now()}.png`;
        const { url: imageUrl } = await storagePut(imageKey, imageBuffer, "image/png");
        
        // Call OpenAI for analysis
        const { invokeLLM } = await import("./_core/llm");
        
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
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a professional trading analyst." },
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ] as any,
            },
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
                  trendStrength: { type: "number" },
                },
                required: ["trend", "confidence"],
                additionalProperties: false,
              },
            },
          },
        });
        
        const analysisData = JSON.parse((response.choices[0].message.content as any) || "{}");
        
        // Save analysis to database
        const analysis = await db.createAnalysis({
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
          analysisRaw: analysisData,
        });
        
        // Increment analysis count
        await db.incrementAnalysisCount(ctx.user.id);
        
        // Log usage
        await db.logUsage({
          userId: ctx.user.id,
          action: "ANALYSIS_CREATED",
          metadata: { analysisId: analysis?.id },
        });
        
        return analysis;
      }),
  }),

  stripe: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({
        plan: z.enum(["weekly", "yearly"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
          apiVersion: "2025-10-29.clover",
        });
        
        const { PRODUCTS } = await import("./products");
        const product = input.plan === "weekly" ? PRODUCTS.WEEKLY : PRODUCTS.YEARLY;
        
        const origin = ctx.req.headers.origin || "http://localhost:3000";
        
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: product.priceId,
              quantity: 1,
            },
          ],
          success_url: `${origin}/home?success=true`,
          cancel_url: `${origin}/subscribe?canceled=true`,
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
          },
          allow_promotion_codes: true,
        });
        
        return {
          url: session.url,
        };
      }),
  }),

  subscription: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getSubscription(ctx.user.id);
    }),
    
    checkPremium: protectedProcedure.query(async ({ ctx }) => {
      const hasPremium = await db.hasActivePremium(ctx.user.id);
      const profile = await db.getOrCreateProfile(ctx.user.id);
      
      return {
        hasPremium,
        status: profile?.subscriptionStatus || "free",
        plan: profile?.subscriptionPlan,
        endsAt: profile?.subscriptionEndsAt,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
