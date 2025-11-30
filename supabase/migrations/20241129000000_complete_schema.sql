-- ===========================================
-- PARALLEL - Complete Database Schema
-- Production-ready database setup
-- Version: 1.0.0
-- ===========================================
--
-- CASCADE DELETE POLICY:
-- User deletion cascades to all user-owned data for GDPR compliance.
-- For data retention requirements, use the soft-delete columns:
-- - profiles.is_deleted, profiles.deleted_at
-- Application should filter on is_deleted = false for normal queries.
-- Hard delete should only occur after retention period (default: 30 days).
--
-- ===========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ===========================================
-- CREDIT AUDIT LOG TABLE (Created first for FK references)
-- Tracks all credit modifications for compliance
-- ===========================================
CREATE TABLE IF NOT EXISTS credit_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- Nullable to preserve audit records after user deletion
  function_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  old_balance INTEGER,
  new_balance INTEGER,
  called_by TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Note: FK to profiles added after profiles table creation via ALTER TABLE

CREATE INDEX IF NOT EXISTS idx_credit_audit_log_user_id ON credit_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_audit_log_created_at ON credit_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_audit_log_function_name ON credit_audit_log(function_name);

-- ===========================================
-- PROFILES TABLE
-- Core user profile data with soft-delete support
-- ===========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',

  -- Subscription
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'unlimited', 'studio')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')),
  subscription_expires_at TIMESTAMPTZ,

  -- Payment providers
  stripe_customer_id TEXT,
  revenuecat_id TEXT,

  -- Credits
  credits_balance INTEGER DEFAULT 50 CHECK (credits_balance >= 0),
  monthly_credits_used INTEGER DEFAULT 0 CHECK (monthly_credits_used >= 0),
  lifetime_credits_used INTEGER DEFAULT 0 CHECK (lifetime_credits_used >= 0),

  -- Engagement
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  total_messages_sent INTEGER DEFAULT 0,
  total_content_created INTEGER DEFAULT 0,

  -- Referrals
  referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  referred_by UUID REFERENCES profiles(id),
  referral_count INTEGER DEFAULT 0,
  referral_earnings NUMERIC(10,2) DEFAULT 0,

  -- Settings
  notifications_enabled BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  adult_content_enabled BOOLEAN DEFAULT false,

  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,

  -- Soft delete support (for GDPR data retention)
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON profiles(is_deleted);

-- Add FK to credit_audit_log now that profiles exists
-- Using SET NULL to preserve audit records when user is deleted
ALTER TABLE credit_audit_log
  ADD CONSTRAINT fk_credit_audit_log_user_id
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ===========================================
-- USER PREFERENCES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_persona_types TEXT[] DEFAULT '{}',
  preferred_world_themes TEXT[] DEFAULT '{}',
  conversation_style TEXT DEFAULT 'balanced',
  response_length TEXT DEFAULT 'medium',
  favorite_music_genres TEXT[] DEFAULT '{}',
  favorite_visual_styles TEXT[] DEFAULT '{}',
  share_creations_publicly BOOLEAN DEFAULT false,
  allow_ai_learning BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ===========================================
-- PERSONAS TABLE
-- AI companion personas
-- ===========================================
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  price_credits INTEGER DEFAULT 0,

  name TEXT NOT NULL,
  persona_type TEXT NOT NULL CHECK (persona_type IN ('romantic', 'friend', 'mentor', 'trainer', 'strategist', 'hype', 'advisor', 'coach', 'creative', 'roleplay', 'custom')),
  tagline TEXT,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,

  -- Personality configuration
  personality JSONB DEFAULT '{
    "traits": [],
    "speaking_style": "friendly",
    "emotional_range": "balanced",
    "humor_level": "moderate",
    "formality": "casual",
    "empathy_level": "high",
    "assertiveness": "moderate"
  }',

  -- Voice settings
  voice_id TEXT,
  voice_name TEXT,
  voice_preview_url TEXT,
  voice_settings JSONB DEFAULT '{"stability": 0.5, "similarity_boost": 0.75}',

  -- AI configuration
  system_prompt TEXT,
  example_messages JSONB DEFAULT '[]',
  greeting_message TEXT,
  default_world_id UUID,

  -- Stats
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,

  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for personas
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_is_public ON personas(is_public);
CREATE INDEX IF NOT EXISTS idx_personas_persona_type ON personas(persona_type);
CREATE INDEX IF NOT EXISTS idx_personas_tags ON personas USING GIN(tags);
-- UNIQUE constraint on name for seed data idempotency (ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS idx_personas_name ON personas(name) WHERE is_public = true;

-- ===========================================
-- USER PERSONAS TABLE (Junction)
-- User's unlocked/owned personas
-- ===========================================
CREATE TABLE IF NOT EXISTS user_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  nickname TEXT,
  custom_avatar_url TEXT,
  relationship_level INTEGER DEFAULT 1,
  affection_score INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  is_favorite BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, persona_id)
);

CREATE INDEX IF NOT EXISTS idx_user_personas_user_id ON user_personas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_personas_persona_id ON user_personas(persona_id);
CREATE INDEX IF NOT EXISTS idx_user_personas_is_favorite ON user_personas(is_favorite) WHERE is_favorite = true;

-- ===========================================
-- WORLDS TABLE
-- Immersive environments/themes
-- ===========================================
CREATE TABLE IF NOT EXISTS worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  price_credits INTEGER DEFAULT 0,

  name TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN ('cyber', 'retro', 'tropical', 'space', 'luxury', 'fantasy', 'horror', 'romance', 'adventure', 'custom')),
  tagline TEXT,
  description TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,
  background_url TEXT,

  color_scheme JSONB DEFAULT '{"primary": "#8B5CF6", "secondary": "#EC4899", "accent": "#06B6D4"}',
  ambient_music_url TEXT,
  ambient_sounds JSONB DEFAULT '[]',

  setting_description TEXT,
  time_period TEXT,
  location TEXT,
  atmosphere TEXT,

  available_scenarios JSONB DEFAULT '[]',
  available_locations JSONB DEFAULT '[]',
  special_events JSONB DEFAULT '[]',

  -- Stats
  total_visits INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,

  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for worlds
CREATE INDEX IF NOT EXISTS idx_worlds_user_id ON worlds(user_id);
CREATE INDEX IF NOT EXISTS idx_worlds_is_public ON worlds(is_public);
CREATE INDEX IF NOT EXISTS idx_worlds_theme ON worlds(theme);
CREATE INDEX IF NOT EXISTS idx_worlds_is_featured ON worlds(is_featured);
-- UNIQUE constraint on name for seed data idempotency (ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS idx_worlds_name ON worlds(name) WHERE is_public = true;

-- ===========================================
-- USER WORLDS TABLE (Junction)
-- User's unlocked/explored worlds
-- ===========================================
CREATE TABLE IF NOT EXISTS user_worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  exploration_level INTEGER DEFAULT 1,
  discovered_locations JSONB DEFAULT '[]',
  completed_scenarios JSONB DEFAULT '[]',
  total_visits INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, world_id)
);

CREATE INDEX IF NOT EXISTS idx_user_worlds_user_id ON user_worlds(user_id);
CREATE INDEX IF NOT EXISTS idx_user_worlds_world_id ON user_worlds(world_id);

-- ===========================================
-- CONVERSATIONS TABLE
-- Chat sessions between users and personas
-- ===========================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  world_id UUID REFERENCES worlds(id) ON DELETE SET NULL,

  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  title TEXT,
  scenario TEXT,
  current_location TEXT,
  mood TEXT,

  message_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_persona_id ON conversations(persona_id);
CREATE INDEX IF NOT EXISTS idx_conversations_world_id ON conversations(world_id);
CREATE INDEX IF NOT EXISTS idx_conversations_is_active ON conversations(is_active);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- ===========================================
-- MESSAGES TABLE
-- Individual messages in conversations
-- ===========================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  attachments JSONB DEFAULT '[]',
  generated_content_id UUID,

  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  generation_time_ms INTEGER,

  detected_emotions JSONB DEFAULT '{}',
  sentiment_score NUMERIC(3,2),

  is_edited BOOLEAN DEFAULT false,
  is_regenerated BOOLEAN DEFAULT false,
  reaction TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_generated_content_id ON messages(generated_content_id) WHERE generated_content_id IS NOT NULL;

-- ===========================================
-- MEMORIES TABLE
-- Long-term memory storage for personas
-- ===========================================
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,

  memory_type TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  embedding vector(1536),

  importance_score NUMERIC(3,2) DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,

  source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  source_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_persona_id ON memories(persona_id);
CREATE INDEX IF NOT EXISTS idx_memories_memory_type ON memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_memories_user_persona ON memories(user_id, persona_id);

-- HNSW index for fast vector similarity search (requires pgvector 0.5.0+)
-- Using cosine distance for normalized embeddings
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ===========================================
-- GENERATED CONTENT TABLE
-- AI-generated music, images, videos
-- ===========================================
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  content_type TEXT NOT NULL CHECK (content_type IN ('music', 'video', 'image', 'meme', 'story', 'post', 'reel', 'cover')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  prompt TEXT NOT NULL,
  style TEXT,
  parameters JSONB DEFAULT '{}',

  result_url TEXT,
  result_urls JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  duration_seconds INTEGER,

  provider TEXT NOT NULL,
  provider_job_id TEXT,
  model TEXT,

  credits_used INTEGER DEFAULT 0,
  estimated_cost NUMERIC(10,4),

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  title TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_content_type ON generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);
CREATE INDEX IF NOT EXISTS idx_generated_content_is_public ON generated_content(is_public);
CREATE INDEX IF NOT EXISTS idx_generated_content_created_at ON generated_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_content_provider_job_id ON generated_content(provider_job_id) WHERE provider_job_id IS NOT NULL;

-- ===========================================
-- SUBSCRIPTIONS TABLE
-- User subscription records
-- ===========================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro', 'unlimited', 'studio')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')),

  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_subscription_id TEXT UNIQUE,
  provider_customer_id TEXT,

  price_amount NUMERIC(10,2) DEFAULT 0,
  price_currency TEXT DEFAULT 'usd',
  billing_interval TEXT DEFAULT 'month',

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id ON subscriptions(provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_customer_id ON subscriptions(provider_customer_id);

-- ===========================================
-- PURCHASES TABLE
-- One-time purchases (credits, items)
-- ===========================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('subscription', 'credits', 'world', 'persona', 'voice', 'outfit', 'boost')),
  item_id TEXT,
  item_name TEXT,

  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  credits_amount INTEGER,

  provider TEXT NOT NULL,
  provider_transaction_id TEXT,
  status TEXT DEFAULT 'completed',

  refunded BOOLEAN DEFAULT false,
  refunded_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_type ON purchases(purchase_type);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_provider_transaction_id ON purchases(provider_transaction_id);

-- ===========================================
-- CREDIT TRANSACTIONS TABLE
-- Credit balance history
-- ===========================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  source TEXT NOT NULL,
  source_id TEXT,
  description TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_source ON credit_transactions(source);

-- ===========================================
-- REFERRALS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'pending',
  referrer_credits_earned INTEGER DEFAULT 0,
  referred_credits_earned INTEGER DEFAULT 0,
  referrer_paid BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ===========================================
-- DAILY REWARDS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS daily_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  day_number INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_id TEXT,
  reward_amount INTEGER,

  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_claimed ON daily_rewards(claimed);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_expires_at ON daily_rewards(expires_at);

-- ===========================================
-- BOOSTS TABLE
-- Temporary multipliers/bonuses
-- ===========================================
CREATE TABLE IF NOT EXISTS boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  boost_type TEXT NOT NULL,
  multiplier NUMERIC(3,2) DEFAULT 1.0,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  source TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boosts_user_id ON boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_boosts_expires_at ON boosts(expires_at);
CREATE INDEX IF NOT EXISTS idx_boosts_active ON boosts(user_id, expires_at) WHERE expires_at > NOW();

-- ===========================================
-- ANALYTICS EVENTS TABLE
-- Note: NULL user_id allowed for anonymous/unauthenticated events
-- Ensure no PII is logged for anonymous events (GDPR compliance)
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  event_name TEXT NOT NULL,
  event_category TEXT,
  properties JSONB DEFAULT '{}',

  session_id TEXT,
  device_type TEXT,
  platform TEXT,
  app_version TEXT,

  country TEXT,
  region TEXT,
  city TEXT,

  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- ===========================================
-- ADMIN USERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('moderator', 'admin', 'super_admin')),
  permissions JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- ===========================================
-- CONTENT REPORTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_type ON content_reports(content_type);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);

-- ===========================================
-- PUSH TOKENS TABLE
-- Note: Token is unique globally - a device can only belong to one user
-- On conflict, application should update the user_id to transfer the token
-- ===========================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id TEXT,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_is_active ON push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON push_tokens(platform);

-- ===========================================
-- SCHEDULED NOTIFICATIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',

  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  notification_type TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON scheduled_notifications(sent);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending ON scheduled_notifications(scheduled_for) WHERE sent = false;

-- ===========================================
-- WEBHOOK EVENTS TABLE
-- Idempotency for webhooks
-- ===========================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  provider TEXT DEFAULT 'stripe',
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Explicit trigger creation for each table (for better auditability)
-- profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_preferences
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- personas
DROP TRIGGER IF EXISTS update_personas_updated_at ON personas;
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_personas
DROP TRIGGER IF EXISTS update_user_personas_updated_at ON user_personas;
CREATE TRIGGER update_user_personas_updated_at BEFORE UPDATE ON user_personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- worlds
DROP TRIGGER IF EXISTS update_worlds_updated_at ON worlds;
CREATE TRIGGER update_worlds_updated_at BEFORE UPDATE ON worlds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_worlds
DROP TRIGGER IF EXISTS update_user_worlds_updated_at ON user_worlds;
CREATE TRIGGER update_user_worlds_updated_at BEFORE UPDATE ON user_worlds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- memories
DROP TRIGGER IF EXISTS update_memories_updated_at ON memories;
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- generated_content
DROP TRIGGER IF EXISTS update_generated_content_updated_at ON generated_content;
CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON generated_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- admin_users
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- push_tokens
DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_tokens;
CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- CREDIT MANAGEMENT FUNCTIONS
-- All functions validate input and log to audit table
-- ===========================================

-- Atomic credit increment function with audit logging
CREATE OR REPLACE FUNCTION increment_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  old_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Validate input
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be a positive integer, got: %', p_amount;
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  -- Get current balance with lock
  SELECT credits_balance INTO old_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF old_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Update balance
  UPDATE profiles
  SET
    credits_balance = credits_balance + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits_balance INTO new_balance;

  -- Log to audit table
  INSERT INTO credit_audit_log (user_id, function_name, amount, old_balance, new_balance, called_by)
  VALUES (p_user_id, 'increment_credits', p_amount, old_balance, new_balance, current_user);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Restrict execution to service role only
REVOKE EXECUTE ON FUNCTION increment_credits FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_credits TO service_role;

-- Atomic credit deduction function with validation and audit logging
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error_message TEXT) AS $$
DECLARE
  current_balance INTEGER;
  result_balance INTEGER;
BEGIN
  -- Validate input
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT false, 0, format('Amount must be a positive integer, got: %s', p_amount)::TEXT;
    RETURN;
  END IF;

  IF p_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User ID cannot be null'::TEXT;
    RETURN;
  END IF;

  -- Get current balance with row lock
  SELECT credits_balance INTO current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user exists
  IF current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  -- Check if sufficient balance
  IF current_balance < p_amount THEN
    RETURN QUERY SELECT false, current_balance, format('Insufficient credits: has %s, needs %s', current_balance, p_amount)::TEXT;
    RETURN;
  END IF;

  -- Deduct credits
  UPDATE profiles
  SET
    credits_balance = credits_balance - p_amount,
    monthly_credits_used = monthly_credits_used + p_amount,
    lifetime_credits_used = COALESCE(lifetime_credits_used, 0) + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits_balance INTO result_balance;

  -- Log to audit table
  INSERT INTO credit_audit_log (user_id, function_name, amount, old_balance, new_balance, called_by)
  VALUES (p_user_id, 'deduct_credits', -p_amount, current_balance, result_balance, current_user);

  RETURN QUERY SELECT true, result_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Restrict execution to service role only
REVOKE EXECUTE ON FUNCTION deduct_credits FROM PUBLIC;
GRANT EXECUTE ON FUNCTION deduct_credits TO service_role;

-- Reset monthly credits function with audit logging
CREATE OR REPLACE FUNCTION reset_monthly_credits(
  p_user_id UUID,
  p_monthly_credits INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  old_balance INTEGER;
BEGIN
  -- Validate input
  IF p_monthly_credits IS NULL OR p_monthly_credits < 0 THEN
    RAISE EXCEPTION 'Monthly credits must be a non-negative integer, got: %', p_monthly_credits;
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  -- Get current balance
  SELECT credits_balance INTO old_balance
  FROM profiles
  WHERE id = p_user_id;

  IF old_balance IS NULL THEN
    RETURN false;
  END IF;

  -- Reset credits
  UPDATE profiles
  SET
    credits_balance = p_monthly_credits,
    monthly_credits_used = 0,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log to audit table
  INSERT INTO credit_audit_log (user_id, function_name, amount, old_balance, new_balance, called_by)
  VALUES (p_user_id, 'reset_monthly_credits', p_monthly_credits - old_balance, old_balance, p_monthly_credits, current_user);

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Restrict execution to service role only
REVOKE EXECUTE ON FUNCTION reset_monthly_credits FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reset_monthly_credits TO service_role;

-- Increment message count function
CREATE OR REPLACE FUNCTION increment_message_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  UPDATE profiles
  SET
    total_messages_sent = total_messages_sent + 1,
    last_active_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Restrict execution to service role only
REVOKE EXECUTE ON FUNCTION increment_message_count FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_message_count TO service_role;

-- Search memories with vector similarity
-- Uses HNSW index for fast approximate nearest neighbor search
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  p_user_id UUID,
  p_persona_id UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  summary TEXT,
  memory_type TEXT,
  importance_score NUMERIC,
  similarity FLOAT
) AS $$
BEGIN
  -- Validate inputs
  IF query_embedding IS NULL THEN
    RAISE EXCEPTION 'Query embedding cannot be null';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  IF match_threshold < 0 OR match_threshold > 1 THEN
    RAISE EXCEPTION 'Match threshold must be between 0 and 1, got: %', match_threshold;
  END IF;

  IF match_count <= 0 THEN
    RAISE EXCEPTION 'Match count must be positive, got: %', match_count;
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.summary,
    m.memory_type,
    m.importance_score,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM memories m
  WHERE m.user_id = p_user_id
    AND (p_persona_id IS NULL OR m.persona_id = p_persona_id)
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Handle new user creation (trigger on auth.users)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail auth
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Soft delete function for profiles
CREATE OR REPLACE FUNCTION soft_delete_profile(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET
    is_deleted = true,
    deleted_at = NOW(),
    -- Anonymize PII
    email = 'deleted_' || id::TEXT || '@deleted.local',
    username = 'deleted_' || encode(gen_random_bytes(8), 'hex'),
    display_name = 'Deleted User',
    avatar_url = NULL,
    bio = NULL,
    date_of_birth = NULL,
    updated_at = NOW()
  WHERE id = p_user_id AND is_deleted = false;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Restrict execution to service role only
REVOKE EXECUTE ON FUNCTION soft_delete_profile FROM PUBLIC;
GRANT EXECUTE ON FUNCTION soft_delete_profile TO service_role;

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Profiles policies (exclude soft-deleted)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id AND is_deleted = false);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id AND is_deleted = false);
CREATE POLICY "Service role full access to profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to user_preferences" ON user_preferences FOR ALL USING (auth.role() = 'service_role');

-- Personas policies
CREATE POLICY "Anyone can view public personas" ON personas FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "Users can manage own personas" ON personas FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access to personas" ON personas FOR ALL USING (auth.role() = 'service_role');

-- User personas policies
CREATE POLICY "Users can manage own user_personas" ON user_personas FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access to user_personas" ON user_personas FOR ALL USING (auth.role() = 'service_role');

-- Worlds policies
CREATE POLICY "Anyone can view public worlds" ON worlds FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "Users can manage own worlds" ON worlds FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access to worlds" ON worlds FOR ALL USING (auth.role() = 'service_role');

-- User worlds policies
CREATE POLICY "Users can manage own user_worlds" ON user_worlds FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access to user_worlds" ON user_worlds FOR ALL USING (auth.role() = 'service_role');

-- Conversations policies
CREATE POLICY "Users can manage own conversations" ON conversations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access to conversations" ON conversations FOR ALL USING (auth.role() = 'service_role');

-- Messages policies
CREATE POLICY "Users can view messages in own conversations" ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert messages in own conversations" ON messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Service role full access to messages" ON messages FOR ALL USING (auth.role() = 'service_role');

-- Memories policies
CREATE POLICY "Users can manage own memories" ON memories FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access to memories" ON memories FOR ALL USING (auth.role() = 'service_role');

-- Generated content policies
CREATE POLICY "Users can view own content" ON generated_content FOR SELECT USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY "Users can manage own content" ON generated_content FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role full access to generated_content" ON generated_content FOR ALL USING (auth.role() = 'service_role');

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role manages subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');

-- Purchases policies
CREATE POLICY "Users can view own purchases" ON purchases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role manages purchases" ON purchases FOR ALL USING (auth.role() = 'service_role');

-- Credit transactions policies
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role manages transactions" ON credit_transactions FOR ALL USING (auth.role() = 'service_role');

-- Credit audit log policies (read-only for users, full for service role)
CREATE POLICY "Users can view own credit audit" ON credit_audit_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role manages credit audit" ON credit_audit_log FOR ALL USING (auth.role() = 'service_role');

-- Referrals policies
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY "Service role manages referrals" ON referrals FOR ALL USING (auth.role() = 'service_role');

-- Daily rewards policies
CREATE POLICY "Users can manage own daily rewards" ON daily_rewards FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role manages daily_rewards" ON daily_rewards FOR ALL USING (auth.role() = 'service_role');

-- Boosts policies
CREATE POLICY "Users can view own boosts" ON boosts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role manages boosts" ON boosts FOR ALL USING (auth.role() = 'service_role');

-- Analytics policies (allow anonymous inserts for unauthenticated tracking)
CREATE POLICY "Users can insert own analytics" ON analytics_events FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Service role full access to analytics" ON analytics_events FOR ALL USING (auth.role() = 'service_role');

-- Admin users policies
CREATE POLICY "Admins can view admin users" ON admin_users FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
CREATE POLICY "Service role manages admin users" ON admin_users FOR ALL USING (auth.role() = 'service_role');

-- Content reports policies
CREATE POLICY "Users can create reports" ON content_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users can view own reports" ON content_reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "Admins can manage reports" ON content_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
CREATE POLICY "Service role manages reports" ON content_reports FOR ALL USING (auth.role() = 'service_role');

-- Push tokens policies
CREATE POLICY "Users can manage own push tokens" ON push_tokens FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Service role manages push_tokens" ON push_tokens FOR ALL USING (auth.role() = 'service_role');

-- Scheduled notifications policies
CREATE POLICY "Users can view own notifications" ON scheduled_notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role manages notifications" ON scheduled_notifications FOR ALL USING (auth.role() = 'service_role');

-- Webhook events policies (service role only)
CREATE POLICY "Service role manages webhook events" ON webhook_events FOR ALL USING (auth.role() = 'service_role');

-- ===========================================
-- SEED DATA - Default Personas
-- Uses ON CONFLICT DO NOTHING for idempotency
-- ===========================================
INSERT INTO personas (name, persona_type, is_public, tagline, description, personality, greeting_message)
VALUES
  ('Luna', 'friend', true, 'Your supportive AI bestie', 'Luna is a warm, empathetic friend who''s always there to listen and support you through anything.',
   '{"traits": ["supportive", "empathetic", "warm"], "speaking_style": "friendly", "emotional_range": "high", "humor_level": "moderate", "formality": "casual", "empathy_level": "very_high", "assertiveness": "gentle"}',
   'Hey there! I''m Luna, and I''m so happy to meet you! How are you doing today?'),

  ('Max', 'trainer', true, 'Your AI fitness coach', 'Max is an energetic personal trainer who motivates you to reach your fitness goals.',
   '{"traits": ["motivating", "energetic", "disciplined"], "speaking_style": "encouraging", "emotional_range": "positive", "humor_level": "moderate", "formality": "casual", "empathy_level": "moderate", "assertiveness": "high"}',
   'What''s up, champ! Ready to crush some goals today? Let''s get after it!'),

  ('Sage', 'mentor', true, 'Wisdom for your journey', 'Sage is a thoughtful mentor who provides guidance and helps you navigate life''s challenges.',
   '{"traits": ["wise", "patient", "thoughtful"], "speaking_style": "calm", "emotional_range": "balanced", "humor_level": "subtle", "formality": "balanced", "empathy_level": "high", "assertiveness": "moderate"}',
   'Welcome, seeker. I sense you have questions. Let''s explore them together.'),

  ('Aria', 'creative', true, 'Your creative muse', 'Aria is an artistic soul who inspires creativity and helps bring your ideas to life.',
   '{"traits": ["creative", "inspiring", "imaginative"], "speaking_style": "artistic", "emotional_range": "expressive", "humor_level": "playful", "formality": "casual", "empathy_level": "high", "assertiveness": "gentle"}',
   'Oh, hello there, beautiful soul! I can already sense the creativity flowing through you. What shall we create today?'),

  ('Rex', 'hype', true, 'Your biggest fan', 'Rex is your ultimate hype person who celebrates your wins and pumps you up.',
   '{"traits": ["enthusiastic", "supportive", "energetic"], "speaking_style": "excited", "emotional_range": "very_high", "humor_level": "high", "formality": "very_casual", "empathy_level": "moderate", "assertiveness": "high"}',
   'YOOOO! What''s good?! I''ve been waiting all day to see what amazing things you''ve been up to!')
ON CONFLICT (name) WHERE is_public = true DO NOTHING;

-- ===========================================
-- SEED DATA - Default Worlds
-- Uses ON CONFLICT DO NOTHING for idempotency
-- ===========================================
INSERT INTO worlds (name, theme, is_public, tagline, description, setting_description, atmosphere)
VALUES
  ('Neon City', 'cyber', true, 'A cyberpunk metropolis', 'A sprawling neon-lit city where technology and humanity intertwine.',
   'Towering skyscrapers pierce through perpetual smog, their surfaces alive with holographic advertisements. Flying vehicles zip between buildings as rain reflects the countless neon signs below.',
   'Electric, mysterious, futuristic'),

  ('Sunset Beach', 'tropical', true, 'Paradise awaits', 'A serene tropical paradise with crystal waters and golden sands.',
   'Warm sand between your toes, gentle waves lapping at the shore. Palm trees sway in the ocean breeze as the sun paints the sky in shades of orange and pink.',
   'Relaxing, warm, peaceful'),

  ('Cosmic Station', 'space', true, 'Among the stars', 'A space station orbiting a distant planet, gateway to the cosmos.',
   'Stars stretch infinitely outside the observation deck. The station hums with advanced technology as ships dock and depart, carrying explorers to unknown worlds.',
   'Awe-inspiring, vast, adventurous'),

  ('Mystic Grove', 'fantasy', true, 'Where magic lives', 'An enchanted forest where ancient magic flows through every living thing.',
   'Towering ancient trees with luminescent bark, magical creatures peeking from the underbrush. Floating lights dance through the air as mystical energy pulses through the land.',
   'Magical, mysterious, enchanting'),

  ('Velvet Lounge', 'luxury', true, 'Elegance redefined', 'An upscale lounge where sophistication meets comfort.',
   'Plush velvet seating, soft jazz playing in the background. Crystal chandeliers cast warm light across marble floors as champagne flows freely.',
   'Sophisticated, intimate, luxurious')
ON CONFLICT (name) WHERE is_public = true DO NOTHING;

-- ===========================================
-- TABLE COMMENTS
-- ===========================================
COMMENT ON TABLE profiles IS 'User profiles with subscription and credit information. Supports soft-delete for GDPR compliance.';
COMMENT ON TABLE credit_audit_log IS 'Audit log for all credit balance modifications. Used for compliance and debugging.';
COMMENT ON TABLE personas IS 'AI companion personas available in the app';
COMMENT ON TABLE worlds IS 'Immersive environment themes for conversations';
COMMENT ON TABLE conversations IS 'Chat sessions between users and AI personas';
COMMENT ON TABLE messages IS 'Individual messages in conversations';
COMMENT ON TABLE memories IS 'Long-term memory storage for AI personas with vector embeddings';
COMMENT ON TABLE subscriptions IS 'User subscription records from payment providers';
COMMENT ON TABLE webhook_events IS 'Processed webhook events for idempotency';

COMMENT ON FUNCTION increment_credits IS 'Atomically add credits to user balance with audit logging';
COMMENT ON FUNCTION deduct_credits IS 'Atomically deduct credits with validation and audit logging';
COMMENT ON FUNCTION reset_monthly_credits IS 'Reset credits on subscription renewal with audit logging';
COMMENT ON FUNCTION search_memories IS 'Vector similarity search for persona memories using HNSW index';
COMMENT ON FUNCTION soft_delete_profile IS 'Soft delete user profile with PII anonymization';
