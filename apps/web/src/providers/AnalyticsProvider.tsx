'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@parallel/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize analytics
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (apiKey) {
      analytics.init(apiKey, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      });
    }
  }, []);

  // Track page views
  useEffect(() => {
    if (pathname) {
      analytics.page({
        path: pathname,
        title: document.title,
        referrer: document.referrer,
      });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
