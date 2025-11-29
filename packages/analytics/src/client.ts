import posthog from 'posthog-js';
import type { AnalyticsUser, AnalyticsEvent, PageViewEvent } from './types';
import { AnalyticsEvents } from './events';

let isInitialized = false;

export function initAnalytics(apiKey: string, options?: { host?: string }) {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;

  posthog.init(apiKey, {
    api_host: options?.host || 'https://app.posthog.com',
    capture_pageview: false, // We'll handle this manually
    capture_pageleave: true,
    persistence: 'localStorage',
    autocapture: true,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskInputFn: (text, element) => {
        // Mask sensitive inputs
        if (element?.getAttribute('type') === 'password') return '*'.repeat(text.length);
        if (element?.getAttribute('name')?.includes('card')) return '*'.repeat(text.length);
        return text;
      },
    },
  });

  isInitialized = true;
}

export function identifyUser(user: AnalyticsUser) {
  if (typeof window === 'undefined') return;

  posthog.identify(user.id, {
    email: user.email,
    subscription_tier: user.subscription_tier,
    created_at: user.created_at,
  });
}

export function resetUser() {
  if (typeof window === 'undefined') return;
  posthog.reset();
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  posthog.capture(event, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

export function trackPageView(pageView: PageViewEvent) {
  if (typeof window === 'undefined') return;

  posthog.capture('$pageview', {
    $current_url: pageView.path,
    $title: pageView.title,
    $referrer: pageView.referrer,
  });
}

export function setUserProperties(properties: Record<string, any>) {
  if (typeof window === 'undefined') return;
  posthog.people.set(properties);
}

export function incrementUserProperty(property: string, value: number = 1) {
  if (typeof window === 'undefined') return;
  posthog.people.set_once({ [property]: 0 });
  posthog.capture('$set', {
    $set: { [property]: value },
  });
}

// Feature flags
export function isFeatureEnabled(flagKey: string): boolean {
  if (typeof window === 'undefined') return false;
  return posthog.isFeatureEnabled(flagKey) || false;
}

export function getFeatureFlag(flagKey: string): string | boolean | undefined {
  if (typeof window === 'undefined') return undefined;
  return posthog.getFeatureFlag(flagKey);
}

// Helper functions for common events
export const analytics = {
  init: initAnalytics,
  identify: identifyUser,
  reset: resetUser,
  track: trackEvent,
  page: trackPageView,
  setUserProperties,

  // User lifecycle
  trackSignUp: (userId: string, method: string) => {
    trackEvent(AnalyticsEvents.USER_SIGNED_UP, { user_id: userId, method });
  },

  trackLogin: (userId: string, method: string) => {
    trackEvent(AnalyticsEvents.USER_LOGGED_IN, { user_id: userId, method });
  },

  trackLogout: () => {
    trackEvent(AnalyticsEvents.USER_LOGGED_OUT);
    resetUser();
  },

  // Subscription
  trackSubscriptionView: (tier: string) => {
    trackEvent(AnalyticsEvents.SUBSCRIPTION_VIEWED, { tier });
  },

  trackSubscriptionStart: (tier: string, price: number) => {
    trackEvent(AnalyticsEvents.SUBSCRIPTION_STARTED, { tier, price, currency: 'USD' });
  },

  // Chat
  trackChatMessage: (personaId: string, personaType: string, messageLength: number) => {
    trackEvent(AnalyticsEvents.CHAT_MESSAGE_SENT, {
      persona_id: personaId,
      persona_type: personaType,
      message_length: messageLength,
    });
  },

  // Content generation
  trackContentGeneration: (
    contentType: string,
    creditsUsed: number,
    success: boolean,
    generationTime?: number
  ) => {
    trackEvent(
      success
        ? AnalyticsEvents.CONTENT_GENERATION_COMPLETED
        : AnalyticsEvents.CONTENT_GENERATION_FAILED,
      {
        content_type: contentType,
        credits_used: creditsUsed,
        generation_time_ms: generationTime,
      }
    );
  },

  // Errors
  trackError: (error: Error, context?: Record<string, any>) => {
    trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  },
};

export default analytics;
