export const PRODUCTS = {
  WEEKLY: {
    name: "W-AI Premium - Weekly",
    priceId: process.env.STRIPE_PRICE_WEEKLY || "price_weekly",
    amount: 799, // $7.99
    currency: "usd",
    interval: "week" as const,
  },
  YEARLY: {
    name: "W-AI Premium - Yearly",
    priceId: process.env.STRIPE_PRICE_YEARLY || "price_yearly",
    amount: 3999, // $39.99
    currency: "usd",
    interval: "year" as const,
  },
} as const;

export type ProductKey = keyof typeof PRODUCTS;
