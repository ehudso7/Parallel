export interface AnalyticsUser {
  id: string;
  email?: string;
  subscription_tier?: string;
  created_at?: string;
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface PageViewEvent {
  path: string;
  title?: string;
  referrer?: string;
}

export interface ConversionEvent {
  type: 'signup' | 'subscription' | 'purchase' | 'referral';
  value?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface ChatEvent {
  personaId: string;
  personaType: string;
  worldId?: string;
  messageLength: number;
  responseTime?: number;
}

export interface ContentGenerationEvent {
  contentType: 'image' | 'music' | 'video';
  prompt?: string;
  creditsUsed: number;
  success: boolean;
  generationTime?: number;
}

export interface EngagementEvent {
  feature: string;
  action: string;
  duration?: number;
  metadata?: Record<string, any>;
}
