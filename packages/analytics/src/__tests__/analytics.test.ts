import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnalyticsEvents } from '../events';

// Create mock functions that persist across tests
const mockInit = vi.fn();
const mockIdentify = vi.fn();
const mockReset = vi.fn();
const mockCapture = vi.fn();
const mockPeopleSet = vi.fn();
const mockPeopleSetOnce = vi.fn();
const mockIsFeatureEnabled = vi.fn(() => false);
const mockGetFeatureFlag = vi.fn(() => undefined);

// Mock posthog-js before importing client
vi.mock('posthog-js', () => ({
  default: {
    init: mockInit,
    identify: mockIdentify,
    reset: mockReset,
    capture: mockCapture,
    people: {
      set: mockPeopleSet,
      set_once: mockPeopleSetOnce,
    },
    isFeatureEnabled: mockIsFeatureEnabled,
    getFeatureFlag: mockGetFeatureFlag,
  },
}));

describe('Analytics Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window for client-side tests
    global.window = {} as Window & typeof globalThis;
    // Reset the initialized state by re-importing the module
    vi.resetModules();
  });

  afterEach(() => {
    // @ts-expect-error - Intentionally deleting window for test cleanup
    delete global.window;
  });

  describe('initAnalytics', () => {
    it('should initialize PostHog with correct configuration', async () => {
      const { initAnalytics } = await import('../client');

      initAnalytics('test-api-key', { host: 'https://custom.posthog.com' });

      expect(mockInit).toHaveBeenCalledWith(
        'test-api-key',
        expect.objectContaining({
          api_host: 'https://custom.posthog.com',
          capture_pageview: false,
        })
      );
    });
  });

  describe('identifyUser', () => {
    it('should identify user with correct properties', async () => {
      const { identifyUser } = await import('../client');

      identifyUser({
        id: 'user-123',
        email: 'test@example.com',
        subscription_tier: 'pro',
      });

      expect(mockIdentify).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          email: 'test@example.com',
          subscription_tier: 'pro',
        })
      );
    });
  });

  describe('trackEvent', () => {
    it('should capture event with properties', async () => {
      const { trackEvent } = await import('../client');

      trackEvent('test_event', { property1: 'value1' });

      expect(mockCapture).toHaveBeenCalledWith(
        'test_event',
        expect.objectContaining({
          property1: 'value1',
        })
      );
    });

    it('should include timestamp in all events', async () => {
      const { trackEvent } = await import('../client');

      trackEvent('test_event');

      expect(mockCapture).toHaveBeenCalledWith(
        'test_event',
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('resetUser', () => {
    it('should reset PostHog identity', async () => {
      const { resetUser } = await import('../client');

      resetUser();

      expect(mockReset).toHaveBeenCalled();
    });
  });

  describe('analytics helper functions', () => {
    it('should track sign up correctly', async () => {
      const { analytics } = await import('../client');

      analytics.trackSignUp('user-123', 'email');

      expect(mockCapture).toHaveBeenCalledWith(
        AnalyticsEvents.USER_SIGNED_UP,
        expect.objectContaining({
          user_id: 'user-123',
          method: 'email',
        })
      );
    });

    it('should track subscription view correctly', async () => {
      const { analytics } = await import('../client');

      analytics.trackSubscriptionView('pro');

      expect(mockCapture).toHaveBeenCalledWith(
        AnalyticsEvents.SUBSCRIPTION_VIEWED,
        expect.objectContaining({
          tier: 'pro',
        })
      );
    });

    it('should track chat message correctly', async () => {
      const { analytics } = await import('../client');

      analytics.trackChatMessage('persona-1', 'companion', 150);

      expect(mockCapture).toHaveBeenCalledWith(
        AnalyticsEvents.CHAT_MESSAGE_SENT,
        expect.objectContaining({
          persona_id: 'persona-1',
          persona_type: 'companion',
          message_length: 150,
        })
      );
    });

    it('should track content generation correctly', async () => {
      const { analytics } = await import('../client');

      analytics.trackContentGeneration('image', 5, true, 2500);

      expect(mockCapture).toHaveBeenCalledWith(
        AnalyticsEvents.CONTENT_GENERATION_COMPLETED,
        expect.objectContaining({
          content_type: 'image',
          credits_used: 5,
          generation_time_ms: 2500,
        })
      );
    });

    it('should track errors correctly', async () => {
      const { analytics } = await import('../client');
      const error = new Error('Test error');

      analytics.trackError(error, { page: 'chat' });

      expect(mockCapture).toHaveBeenCalledWith(
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
