// ===========================================
// PARALLEL - Database Types
// Auto-generated from Supabase schema
// ===========================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Enums
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'unlimited' | 'studio';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
export type PersonaType =
  | 'romantic'
  | 'friend'
  | 'mentor'
  | 'trainer'
  | 'strategist'
  | 'hype'
  | 'advisor'
  | 'coach'
  | 'creative'
  | 'roleplay'
  | 'custom';
export type ContentType =
  | 'music'
  | 'video'
  | 'image'
  | 'meme'
  | 'story'
  | 'post'
  | 'reel'
  | 'cover';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PurchaseType =
  | 'subscription'
  | 'credits'
  | 'world'
  | 'persona'
  | 'voice'
  | 'outfit'
  | 'boost';
export type MessageRole = 'user' | 'assistant' | 'system';
export type WorldTheme =
  | 'cyber'
  | 'retro'
  | 'tropical'
  | 'space'
  | 'luxury'
  | 'fantasy'
  | 'horror'
  | 'romance'
  | 'adventure'
  | 'custom';

// Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: UserPreferencesInsert;
        Update: UserPreferencesUpdate;
      };
      personas: {
        Row: Persona;
        Insert: PersonaInsert;
        Update: PersonaUpdate;
      };
      user_personas: {
        Row: UserPersona;
        Insert: UserPersonaInsert;
        Update: UserPersonaUpdate;
      };
      worlds: {
        Row: World;
        Insert: WorldInsert;
        Update: WorldUpdate;
      };
      user_worlds: {
        Row: UserWorld;
        Insert: UserWorldInsert;
        Update: UserWorldUpdate;
      };
      conversations: {
        Row: Conversation;
        Insert: ConversationInsert;
        Update: ConversationUpdate;
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: MessageUpdate;
      };
      memories: {
        Row: Memory;
        Insert: MemoryInsert;
        Update: MemoryUpdate;
      };
      generated_content: {
        Row: GeneratedContent;
        Insert: GeneratedContentInsert;
        Update: GeneratedContentUpdate;
      };
      subscriptions: {
        Row: Subscription;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
      };
      purchases: {
        Row: Purchase;
        Insert: PurchaseInsert;
        Update: PurchaseUpdate;
      };
      credit_transactions: {
        Row: CreditTransaction;
        Insert: CreditTransactionInsert;
        Update: CreditTransactionUpdate;
      };
      referrals: {
        Row: Referral;
        Insert: ReferralInsert;
        Update: ReferralUpdate;
      };
      daily_rewards: {
        Row: DailyReward;
        Insert: DailyRewardInsert;
        Update: DailyRewardUpdate;
      };
      boosts: {
        Row: Boost;
        Insert: BoostInsert;
        Update: BoostUpdate;
      };
      analytics_events: {
        Row: AnalyticsEvent;
        Insert: AnalyticsEventInsert;
        Update: AnalyticsEventUpdate;
      };
      admin_users: {
        Row: AdminUser;
        Insert: AdminUserInsert;
        Update: AdminUserUpdate;
      };
      content_reports: {
        Row: ContentReport;
        Insert: ContentReportInsert;
        Update: ContentReportUpdate;
      };
      push_tokens: {
        Row: PushToken;
        Insert: PushTokenInsert;
        Update: PushTokenUpdate;
      };
      scheduled_notifications: {
        Row: ScheduledNotification;
        Insert: ScheduledNotificationInsert;
        Update: ScheduledNotificationUpdate;
      };
    };
    Functions: {
      search_memories: {
        Args: {
          query_embedding: number[];
          p_user_id: string;
          p_persona_id?: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          content: string;
          summary: string;
          memory_type: string;
          importance_score: number;
          similarity: number;
        }[];
      };
    };
  };
}

// Profile
export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: string | null;
  timezone: string;
  language: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  stripe_customer_id: string | null;
  revenuecat_id: string | null;
  credits_balance: number;
  monthly_credits_used: number;
  lifetime_credits_used: number;
  current_streak: number;
  longest_streak: number;
  last_active_at: string;
  total_messages_sent: number;
  total_content_created: number;
  referral_code: string;
  referred_by: string | null;
  referral_count: number;
  referral_earnings: number;
  notifications_enabled: boolean;
  email_marketing: boolean;
  adult_content_enabled: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type ProfileInsert = Partial<Profile> & { id: string };
export type ProfileUpdate = Partial<Profile>;

// User Preferences
export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_persona_types: PersonaType[];
  preferred_world_themes: WorldTheme[];
  conversation_style: string;
  response_length: string;
  favorite_music_genres: string[];
  favorite_visual_styles: string[];
  share_creations_publicly: boolean;
  allow_ai_learning: boolean;
  created_at: string;
  updated_at: string;
}

export type UserPreferencesInsert = Partial<UserPreferences> & { user_id: string };
export type UserPreferencesUpdate = Partial<UserPreferences>;

// Persona Personality Config
export interface PersonaPersonality {
  traits: string[];
  speaking_style: string;
  emotional_range: string;
  humor_level: string;
  formality: string;
  empathy_level: string;
  assertiveness: string;
}

// Persona Voice Settings
export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

// Persona
export interface Persona {
  id: string;
  user_id: string | null;
  is_public: boolean;
  is_premium: boolean;
  price_credits: number;
  name: string;
  persona_type: PersonaType;
  tagline: string | null;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  personality: PersonaPersonality;
  voice_id: string | null;
  voice_name: string | null;
  voice_preview_url: string | null;
  voice_settings: VoiceSettings;
  system_prompt: string | null;
  example_messages: Json;
  greeting_message: string | null;
  default_world_id: string | null;
  total_conversations: number;
  total_messages: number;
  average_rating: number;
  total_ratings: number;
  tags: string[];
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type PersonaInsert = Partial<Persona> & { name: string; persona_type: PersonaType };
export type PersonaUpdate = Partial<Persona>;

// User Persona (junction)
export interface UserPersona {
  id: string;
  user_id: string;
  persona_id: string;
  nickname: string | null;
  custom_avatar_url: string | null;
  relationship_level: number;
  affection_score: number;
  total_messages: number;
  last_interaction_at: string | null;
  is_favorite: boolean;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type UserPersonaInsert = Partial<UserPersona> & { user_id: string; persona_id: string };
export type UserPersonaUpdate = Partial<UserPersona>;

// World Color Scheme
export interface WorldColorScheme {
  primary: string;
  secondary: string;
  accent: string;
}

// World
export interface World {
  id: string;
  user_id: string | null;
  is_public: boolean;
  is_premium: boolean;
  is_featured: boolean;
  price_credits: number;
  name: string;
  theme: WorldTheme;
  tagline: string | null;
  description: string | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  background_url: string | null;
  color_scheme: WorldColorScheme;
  ambient_music_url: string | null;
  ambient_sounds: Json;
  setting_description: string | null;
  time_period: string | null;
  location: string | null;
  atmosphere: string | null;
  available_scenarios: Json;
  available_locations: Json;
  special_events: Json;
  total_visits: number;
  total_time_spent: number;
  average_rating: number;
  total_ratings: number;
  tags: string[];
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type WorldInsert = Partial<World> & { name: string; theme: WorldTheme };
export type WorldUpdate = Partial<World>;

// User World (junction)
export interface UserWorld {
  id: string;
  user_id: string;
  world_id: string;
  exploration_level: number;
  discovered_locations: Json;
  completed_scenarios: Json;
  total_visits: number;
  total_time_spent: number;
  last_visit_at: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type UserWorldInsert = Partial<UserWorld> & { user_id: string; world_id: string };
export type UserWorldUpdate = Partial<UserWorld>;

// Conversation
export interface Conversation {
  id: string;
  user_id: string;
  persona_id: string;
  world_id: string | null;
  is_active: boolean;
  is_archived: boolean;
  title: string | null;
  scenario: string | null;
  current_location: string | null;
  mood: string | null;
  message_count: number;
  metadata: Json;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export type ConversationInsert = Partial<Conversation> & { user_id: string; persona_id: string };
export type ConversationUpdate = Partial<Conversation>;

// Message Attachment
export interface MessageAttachment {
  type: 'image' | 'audio' | 'video' | 'file';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

// Message
export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  attachments: MessageAttachment[];
  generated_content_id: string | null;
  model: string | null;
  tokens_used: number;
  generation_time_ms: number | null;
  detected_emotions: Json;
  sentiment_score: number | null;
  is_edited: boolean;
  is_regenerated: boolean;
  reaction: string | null;
  metadata: Json;
  created_at: string;
}

export type MessageInsert = Partial<Message> & {
  conversation_id: string;
  role: MessageRole;
  content: string;
};
export type MessageUpdate = Partial<Message>;

// Memory
export interface Memory {
  id: string;
  user_id: string;
  persona_id: string | null;
  memory_type: string;
  content: string;
  summary: string | null;
  embedding: number[] | null;
  importance_score: number;
  access_count: number;
  last_accessed_at: string | null;
  source_message_id: string | null;
  source_conversation_id: string | null;
  tags: string[];
  metadata: Json;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MemoryInsert = Partial<Memory> & {
  user_id: string;
  memory_type: string;
  content: string;
};
export type MemoryUpdate = Partial<Memory>;

// Generated Content
export interface GeneratedContent {
  id: string;
  user_id: string;
  content_type: ContentType;
  status: GenerationStatus;
  prompt: string;
  style: string | null;
  parameters: Json;
  result_url: string | null;
  result_urls: Json;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  provider: string;
  provider_job_id: string | null;
  model: string | null;
  credits_used: number;
  estimated_cost: number | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  is_public: boolean;
  view_count: number;
  like_count: number;
  share_count: number;
  title: string | null;
  description: string | null;
  tags: string[];
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type GeneratedContentInsert = Partial<GeneratedContent> & {
  user_id: string;
  content_type: ContentType;
  prompt: string;
  provider: string;
};
export type GeneratedContentUpdate = Partial<GeneratedContent>;

// Subscription
export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  provider: string;
  provider_subscription_id: string | null;
  provider_customer_id: string | null;
  price_amount: number;
  price_currency: string;
  billing_interval: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type SubscriptionInsert = Partial<Subscription> & {
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  provider: string;
  price_amount: number;
};
export type SubscriptionUpdate = Partial<Subscription>;

// Purchase
export interface Purchase {
  id: string;
  user_id: string;
  purchase_type: PurchaseType;
  item_id: string | null;
  item_name: string | null;
  amount: number;
  currency: string;
  credits_amount: number | null;
  provider: string;
  provider_transaction_id: string | null;
  status: string;
  refunded: boolean;
  refunded_at: string | null;
  metadata: Json;
  created_at: string;
}

export type PurchaseInsert = Partial<Purchase> & {
  user_id: string;
  purchase_type: PurchaseType;
  amount: number;
  provider: string;
};
export type PurchaseUpdate = Partial<Purchase>;

// Credit Transaction
export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  source: string;
  source_id: string | null;
  description: string | null;
  metadata: Json;
  created_at: string;
}

export type CreditTransactionInsert = Partial<CreditTransaction> & {
  user_id: string;
  amount: number;
  balance_after: number;
  source: string;
};
export type CreditTransactionUpdate = Partial<CreditTransaction>;

// Referral
export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  referrer_credits_earned: number;
  referred_credits_earned: number;
  referrer_paid: boolean;
  converted_at: string | null;
  metadata: Json;
  created_at: string;
}

export type ReferralInsert = Partial<Referral> & { referrer_id: string; referred_id: string };
export type ReferralUpdate = Partial<Referral>;

// Daily Reward
export interface DailyReward {
  id: string;
  user_id: string;
  day_number: number;
  reward_type: string;
  reward_id: string | null;
  reward_amount: number | null;
  claimed: boolean;
  claimed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export type DailyRewardInsert = Partial<DailyReward> & {
  user_id: string;
  day_number: number;
  reward_type: string;
};
export type DailyRewardUpdate = Partial<DailyReward>;

// Boost
export interface Boost {
  id: string;
  user_id: string;
  boost_type: string;
  multiplier: number;
  started_at: string;
  expires_at: string;
  source: string | null;
  created_at: string;
}

export type BoostInsert = Partial<Boost> & { user_id: string; boost_type: string; expires_at: string };
export type BoostUpdate = Partial<Boost>;

// Analytics Event
export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  event_name: string;
  event_category: string | null;
  properties: Json;
  session_id: string | null;
  device_type: string | null;
  platform: string | null;
  app_version: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  created_at: string;
}

export type AnalyticsEventInsert = Partial<AnalyticsEvent> & { event_name: string };
export type AnalyticsEventUpdate = Partial<AnalyticsEvent>;

// Admin User
export interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  permissions: Json;
  created_at: string;
  updated_at: string;
}

export type AdminUserInsert = Partial<AdminUser> & { user_id: string };
export type AdminUserUpdate = Partial<AdminUser>;

// Content Report
export interface ContentReport {
  id: string;
  reporter_id: string | null;
  content_type: string;
  content_id: string;
  reason: string;
  description: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution: string | null;
  created_at: string;
}

export type ContentReportInsert = Partial<ContentReport> & {
  content_type: string;
  content_id: string;
  reason: string;
};
export type ContentReportUpdate = Partial<ContentReport>;

// Push Token
export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  device_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PushTokenInsert = Partial<PushToken> & {
  user_id: string;
  token: string;
  platform: string;
};
export type PushTokenUpdate = Partial<PushToken>;

// Scheduled Notification
export interface ScheduledNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: Json;
  scheduled_for: string;
  sent: boolean;
  sent_at: string | null;
  notification_type: string;
  created_at: string;
}

export type ScheduledNotificationInsert = Partial<ScheduledNotification> & {
  user_id: string;
  title: string;
  body: string;
  scheduled_for: string;
  notification_type: string;
};
export type ScheduledNotificationUpdate = Partial<ScheduledNotification>;

// Extended types with relations
export interface PersonaWithWorld extends Persona {
  world?: World;
}

export interface ConversationWithDetails extends Conversation {
  persona: Persona;
  world?: World;
  messages?: Message[];
}

export interface MessageWithContent extends Message {
  generated_content?: GeneratedContent;
}
