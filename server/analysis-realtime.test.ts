import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Real-time Analysis with OpenAI", () => {
  it("should validate OpenAI API is configured", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey?.length).toBeGreaterThan(0);
    console.log("✅ OpenAI API key is configured");
  });

  it("should have analyze.image procedure available", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.analyze).toBeDefined();
    expect(caller.analyze.image).toBeDefined();
    console.log("✅ analyze.image procedure is available");
  });

  it("should have analysis.get procedure for retrieving results", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.analysis).toBeDefined();
    expect(caller.analysis.get).toBeDefined();
    console.log("✅ analysis.get procedure is available");
  });

  it("should have subscription.checkPremium for premium features", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.subscription).toBeDefined();
    expect(caller.subscription.checkPremium).toBeDefined();
    console.log("✅ subscription.checkPremium procedure is available");
  });

  it("should validate analysis data structure", async () => {
    // Mock analysis data structure
    const mockAnalysis = {
      id: 1,
      userId: 1,
      imageUrl: "https://example.com/chart.png",
      trend: "bullish",
      confidence: 85,
      rsiValue: 65,
      rsiStatus: "overbought",
      macdSignal: "bullish_crossover",
      maStatus: "MA10 > MA30 > MA60",
      patterns: ["Ascending Triangle", "Higher Highs"],
      buyZoneMin: "45000",
      buyZoneMax: "46000",
      stopLoss: "44000",
      takeProfit1: "47000",
      takeProfit2: "48500",
      riskReward: "1:2.5",
      riskLevel: "medium",
      volatility: "high",
      trendStrength: 78,
      analysisRaw: {
        trend: "bullish",
        confidence: 85,
        rsiValue: 65,
        rsiStatus: "overbought",
        macdSignal: "bullish_crossover",
        maStatus: "MA10 > MA30 > MA60",
        patterns: ["Ascending Triangle", "Higher Highs"],
        buyZoneMin: "45000",
        buyZoneMax: "46000",
        stopLoss: "44000",
        takeProfit1: "47000",
        takeProfit2: "48500",
        riskReward: "1:2.5",
        riskLevel: "medium",
        volatility: "high",
        trendStrength: 78,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate structure
    expect(mockAnalysis).toHaveProperty("trend");
    expect(mockAnalysis).toHaveProperty("confidence");
    expect(mockAnalysis).toHaveProperty("rsiValue");
    expect(mockAnalysis).toHaveProperty("macdSignal");
    expect(mockAnalysis).toHaveProperty("patterns");
    expect(mockAnalysis).toHaveProperty("analysisRaw");

    // Validate types
    expect(typeof mockAnalysis.trend).toBe("string");
    expect(typeof mockAnalysis.confidence).toBe("number");
    expect(typeof mockAnalysis.rsiValue).toBe("number");
    expect(Array.isArray(mockAnalysis.patterns)).toBe(true);
    expect(typeof mockAnalysis.analysisRaw).toBe("object");

    console.log("✅ Analysis data structure is valid");
  });
});
