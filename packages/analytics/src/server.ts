import { PostHog } from 'posthog-node';
import type { AnalyticsUser } from './types';
import { AnalyticsEvents } from './events';

let client: PostHog | null = null;

export function initServerAnalytics(apiKey: string, options?: { host?: string }) {
  if (client) return client;

  client = new PostHog(apiKey, {
    host: options?.host || 'https://app.posthog.com',
    flushAt: 20,
    flushInterval: 10000,
  });

  return client;
}

export function getAnalyticsClient(): PostHog | null {
  return client;
}

export async function shutdownAnalytics() {
  if (client) {
    await client.shutdown();
    client = null;
  }
}

export function serverIdentify(user: AnalyticsUser) {
  if (!client) return;

  client.identify({
    distinctId: user.id,
    properties: {
      email: user.email,
      subscription_tier: user.subscription_tier,
      created_at: user.created_at,
    },
  });
}

export function serverTrack(
  userId: string,
  event: string,
  properties?: Record<string, any>
) {
  if (!client) return;

  client.capture({
    distinctId: userId,
    event,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      source: 'server',
    },
  });
}

export function serverSetUserProperties(
  userId: string,
  properties: Record<string, any>
) {
  if (!client) return;

  client.identify({
    distinctId: userId,
    properties,
  });
}

// Server-side analytics helper
export const serverAnalytics = {
  init: initServerAnalytics,
  getClient: getAnalyticsClient,
  shutdown: shutdownAnalytics,
  identify: serverIdentify,
  track: serverTrack,
  setUserProperties: serverSetUserProperties,

  // Revenue tracking
  trackRevenue: (
    userId: string,
    amount: number,
    currency: string,
    type: 'subscription' | 'credits',
    metadata?: Record<string, any>
  ) => {
    serverTrack(userId, 'revenue', {
      amount,
      currency,
      type,
      ...metadata,
    });
  },

  // User lifecycle (server-side)
  trackUserCreated: (userId: string, method: string) => {
    serverTrack(userId, AnalyticsEvents.USER_SIGNED_UP, { method });
  },

  // Subscription events
  trackSubscriptionCreated: (
    userId: string,
    tier: string,
    price: number,
    provider: string
  ) => {
    serverTrack(userId, AnalyticsEvents.SUBSCRIPTION_STARTED, {
      tier,
      price,
      currency: 'USD',
      provider,
    });
  },

  trackSubscriptionCancelled: (userId: string, tier: string, reason?: string) => {
    serverTrack(userId, AnalyticsEvents.SUBSCRIPTION_CANCELLED, {
      tier,
      reason,
    });
  },

  // Credit purchases
  trackCreditsPurchased: (userId: string, amount: number, credits: number) => {
    serverTrack(userId, AnalyticsEvents.CREDITS_PURCHASED, {
      amount,
      currency: 'USD',
      credits,
    });
  },

  // Content generation
  trackContentGenerated: (
    userId: string,
    contentType: string,
    creditsUsed: number,
    generationTime: number
  ) => {
    serverTrack(userId, AnalyticsEvents.CONTENT_GENERATION_COMPLETED, {
      content_type: contentType,
      credits_used: creditsUsed,
      generation_time_ms: generationTime,
    });
  },

  // Referrals
  trackReferralCompleted: (
    referrerId: string,
    referredUserId: string,
    creditsAwarded: number
  ) => {
    serverTrack(referrerId, AnalyticsEvents.REFERRAL_COMPLETED, {
      referred_user_id: referredUserId,
      credits_awarded: creditsAwarded,
    });
  },
};

export default serverAnalytics;
