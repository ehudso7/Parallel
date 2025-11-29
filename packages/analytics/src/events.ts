// Standard event names for consistent tracking across the app
export const AnalyticsEvents = {
  // User lifecycle
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_PROFILE_UPDATED: 'user_profile_updated',
  USER_ONBOARDING_STARTED: 'user_onboarding_started',
  USER_ONBOARDING_COMPLETED: 'user_onboarding_completed',
  USER_ONBOARDING_STEP: 'user_onboarding_step',

  // Subscription & purchases
  SUBSCRIPTION_VIEWED: 'subscription_viewed',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  CREDITS_PURCHASED: 'credits_purchased',
  CREDITS_USED: 'credits_used',

  // Persona interactions
  PERSONA_CREATED: 'persona_created',
  PERSONA_SELECTED: 'persona_selected',
  PERSONA_CUSTOMIZED: 'persona_customized',

  // Chat
  CHAT_STARTED: 'chat_started',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_MESSAGE_RECEIVED: 'chat_message_received',
  CHAT_ENDED: 'chat_ended',

  // Content generation
  CONTENT_GENERATION_STARTED: 'content_generation_started',
  CONTENT_GENERATION_COMPLETED: 'content_generation_completed',
  CONTENT_GENERATION_FAILED: 'content_generation_failed',
  CONTENT_SHARED: 'content_shared',
  CONTENT_DOWNLOADED: 'content_downloaded',

  // World exploration
  WORLD_VIEWED: 'world_viewed',
  WORLD_ENTERED: 'world_entered',
  WORLD_LEFT: 'world_left',

  // Engagement
  DAILY_STREAK_CLAIMED: 'daily_streak_claimed',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  REFERRAL_SHARED: 'referral_shared',
  REFERRAL_COMPLETED: 'referral_completed',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',

  // Feature usage
  FEATURE_USED: 'feature_used',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
