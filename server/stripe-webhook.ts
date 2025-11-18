import { Request, Response } from "express";
import Stripe from "stripe";
import * as db from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).send("No signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract user info from metadata
        const userId = session.client_reference_id || session.metadata?.user_id;
        const customerEmail = session.customer_email || session.metadata?.customer_email;
        
        if (!userId) {
          console.error("[Webhook] No user ID in checkout session");
          break;
        }

        const numericUserId = parseInt(userId);
        
        // Get subscription details
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
          
          // Update user profile
          await db.updateProfile(numericUserId, {
            subscriptionStatus: "active",
            subscriptionPlan: subscription.items.data[0]?.price.recurring?.interval || "unknown",
            subscriptionEndsAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
          });
          
          // Save subscription details
          await db.upsertSubscription({
            userId: numericUserId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: subscription.items.data[0]?.price.recurring?.interval || "unknown",
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : new Date(),
            currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
          
          console.log(`[Webhook] Subscription activated for user ${userId}`);
        }
        
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        
        // Find user by customer ID
        const existingSub = await db.getDb().then(async (dbInstance) => {
          if (!dbInstance) return null;
          const { subscriptions } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const result = await dbInstance
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeCustomerId, customerId))
            .limit(1);
          return result[0] || null;
        });
        
        if (existingSub) {
          await db.updateProfile(existingSub.userId, {
            subscriptionStatus: subscription.status === "active" ? "active" : "free",
            subscriptionEndsAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
          });
          
          await db.upsertSubscription({
            userId: existingSub.userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            plan: subscription.items.data[0]?.price.recurring?.interval || "unknown",
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : new Date(),
            currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
          
          console.log(`[Webhook] Subscription updated for user ${existingSub.userId}`);
        }
        
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        
        // Find user by customer ID
        const existingSub = await db.getDb().then(async (dbInstance) => {
          if (!dbInstance) return null;
          const { subscriptions } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const result = await dbInstance
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeCustomerId, customerId))
            .limit(1);
          return result[0] || null;
        });
        
        if (existingSub) {
          await db.updateProfile(existingSub.userId, {
            subscriptionStatus: "free",
            subscriptionEndsAt: null,
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
