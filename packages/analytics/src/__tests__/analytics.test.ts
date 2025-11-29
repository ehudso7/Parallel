import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analytics, initAnalytics, trackEvent, identifyUser, resetUser } from '../client';
import { AnalyticsEvents } from '../events';

// Mock posthog-js
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    capture: vi.fn(),
    people: {
      set: vi.fn(),
      set_once: vi.fn(),
    },
    isFeatureEnabled: vi.fn(() => false),
    getFeatureFlag: vi.fn(() => undefined),
  },
}));

describe('Analytics Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window for client-side tests
    global.window = {} as any;
  });

  afterEach(() => {
    // @ts-ignore
    delete global.window;
  });

  describe('initAnalytics', () => {
    it('should initialize PostHog with correct configuration', () => {
      const posthog = require('posthog-js').default;

      initAnalytics('test-api-key', { host: 'https://custom.posthog.com' });

      expect(posthog.init).toHaveBeenCalledWith(
        'test-api-key',
        expect.objectContaining({
          api_host: 'https://custom.posthog.com',
          capture_pageview: false,
        })
      );
    });
  });

  describe('identifyUser', () => {
    it('should identify user with correct properties', () => {
      const posthog = require('posthog-js').default;

      identifyUser({
        id: 'user-123',
        email: 'test@example.com',
        subscription_tier: 'pro',
      });

      expect(posthog.identify).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          email: 'test@example.com',
          subscription_tier: 'pro',
        })
      );
    });
  });

  describe('trackEvent', () => {
    it('should capture event with properties', () => {
      const posthog = require('posthog-js').default;

      trackEvent('test_event', { property1: 'value1' });

      expect(posthog.capture).toHaveBeenCalledWith(
        'test_event',
        expect.objectContaining({
          property1: 'value1',
        })
      );
    });

    it('should include timestamp in all events', () => {
      const posthog = require('posthog-js').default;

      trackEvent('test_event');

      expect(posthog.capture).toHaveBeenCalledWith(
        'test_event',
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('resetUser', () => {
    it('should reset PostHog identity', () => {
      const posthog = require('posthog-js').default;

      resetUser();

      expect(posthog.reset).toHaveBeenCalled();
    });
  });

  describe('analytics helper functions', () => {
    it('should track sign up correctly', () => {
      const posthog = require('posthog-js').default;

      analytics.trackSignUp('user-123', 'email');

      expect(posthog.capture).toHaveBeenCalledWith(
        AnalyticsEvents.USER_SIGNED_UP,
        expect.objectContaining({
          user_id: 'user-123',
          method: 'email',
        })
      );
    });

    it('should track subscription view correctly', () => {
      const posthog = require('posthog-js').default;

      analytics.trackSubscriptionView('pro');

      expect(posthog.capture).toHaveBeenCalledWith(
        AnalyticsEvents.SUBSCRIPTION_VIEWED,
        expect.objectContaining({
          tier: 'pro',
        })
      );
    });

    it('should track chat message correctly', () => {
      const posthog = require('posthog-js').default;

      analytics.trackChatMessage('persona-1', 'companion', 150);

      expect(posthog.capture).toHaveBeenCalledWith(
        AnalyticsEvents.CHAT_MESSAGE_SENT,
        expect.objectContaining({
          persona_id: 'persona-1',
          persona_type: 'companion',
          message_length: 150,
        })
      );
    });

    it('should track content generation correctly', () => {
      const posthog = require('posthog-js').default;

      analytics.trackContentGeneration('image', 5, true, 2500);

      expect(posthog.capture).toHaveBeenCalledWith(
        AnalyticsEvents.CONTENT_GENERATION_COMPLETED,
        expect.objectContaining({
          content_type: 'image',
          credits_used: 5,
          generation_time_ms: 2500,
        })
      );
    });

    it('should track errors correctly', () => {
      const posthog = require('posthog-js').default;
      const error = new Error('Test error');

      analytics.trackError(error, { page: 'chat' });

      expect(posthog.capture).toHaveBeenCalledWith(
        AnalyticsEvents.ERROR_OCCURRED,
        expect.objectContaining({
          error_message: 'Test error',
          page: 'chat',
        })
      );
    });
  });
});

describe('Analytics Events', () => {
  it('should have all required event names', () => {
    expect(AnalyticsEvents.USER_SIGNED_UP).toBe('user_signed_up');
    expect(AnalyticsEvents.USER_LOGGED_IN).toBe('user_logged_in');
    expect(AnalyticsEvents.SUBSCRIPTION_STARTED).toBe('subscription_started');
    expect(AnalyticsEvents.CHAT_MESSAGE_SENT).toBe('chat_message_sent');
    expect(AnalyticsEvents.CONTENT_GENERATION_COMPLETED).toBe('content_generation_completed');
  });

  it('should have unique event names', () => {
    const eventNames = Object.values(AnalyticsEvents);
    const uniqueNames = new Set(eventNames);

    expect(eventNames.length).toBe(uniqueNames.size);
  });
});
