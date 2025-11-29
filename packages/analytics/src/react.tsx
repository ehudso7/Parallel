'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { analytics, identifyUser, resetUser } from './client';
import type { AnalyticsUser } from './types';

interface AnalyticsContextType {
  track: typeof analytics.track;
  identify: typeof identifyUser;
  reset: typeof resetUser;
  trackSignUp: typeof analytics.trackSignUp;
  trackLogin: typeof analytics.trackLogin;
  trackLogout: typeof analytics.trackLogout;
  trackSubscriptionView: typeof analytics.trackSubscriptionView;
  trackSubscriptionStart: typeof analytics.trackSubscriptionStart;
  trackChatMessage: typeof analytics.trackChatMessage;
  trackContentGeneration: typeof analytics.trackContentGeneration;
  trackError: typeof analytics.trackError;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  apiKey?: string;
  host?: string;
  user?: AnalyticsUser | null;
}

export function AnalyticsProvider({
  children,
  apiKey,
  host,
  user,
}: AnalyticsProviderProps) {
  useEffect(() => {
    if (apiKey) {
      analytics.init(apiKey, { host });
    }
  }, [apiKey, host]);

  useEffect(() => {
    if (user) {
      analytics.identify(user);
    }
  }, [user]);

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    // Return no-op functions if not within provider
    return {
      track: () => {},
      identify: () => {},
      reset: () => {},
      trackSignUp: () => {},
      trackLogin: () => {},
      trackLogout: () => {},
      trackSubscriptionView: () => {},
      trackSubscriptionStart: () => {},
      trackChatMessage: () => {},
      trackContentGeneration: () => {},
      trackError: () => {},
    };
  }
  return context;
}

// Hook for tracking page views
export function usePageView(pageName: string, properties?: Record<string, any>) {
  const { track } = useAnalytics();

  useEffect(() => {
    track('$pageview', {
      page_name: pageName,
      ...properties,
    });
  }, [pageName, properties, track]);
}

// Hook for tracking feature usage
export function useFeatureTracking(featureName: string) {
  const { track } = useAnalytics();

  return {
    trackUsage: (action: string, properties?: Record<string, any>) => {
      track('feature_used', {
        feature: featureName,
        action,
        ...properties,
      });
    },
  };
}
