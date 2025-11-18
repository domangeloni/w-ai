import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
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
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("subscription.checkPremium", () => {
  it("returns hasPremium false for new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.checkPremium();

    expect(result).toEqual({
      hasPremium: false,
      plan: null,
      endsAt: null,
      status: "free",
    });
  });
});

describe("stripe.createCheckoutSession", () => {
  it("requires plan parameter", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that it validates input
    await expect(async () => {
      await caller.stripe.createCheckoutSession({ plan: "invalid" as any });
    }).rejects.toThrow();
  });
});
