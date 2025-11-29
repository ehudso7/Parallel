-- ===========================================
-- PARALLEL - Complete Database Schema
-- Supabase PostgreSQL
-- ===========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'unlimited', 'studio');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'paused');
CREATE TYPE persona_type AS ENUM ('romantic', 'friend', 'mentor', 'trainer', 'strategist', 'hype', 'advisor', 'coach', 'creative', 'roleplay', 'custom');
CREATE TYPE content_type AS ENUM ('music', 'video', 'image', 'meme', 'story', 'post', 'reel', 'cover');
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE purchase_type AS ENUM ('subscription', 'credits', 'world', 'persona', 'voice', 'outfit', 'boost');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE world_theme AS ENUM ('cyber', 'retro', 'tropical', 'space', 'luxury', 'fantasy', 'horror', 'romance', 'adventure', 'custom');

-- ===========================================
-- USERS & PROFILES
-- ===========================================

CREATE TABLE public.profiles (
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
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_status subscription_status DEFAULT 'active',
    subscription_expires_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    revenuecat_id TEXT,

    -- Credits & Usage
    credits_balance INTEGER DEFAULT 100,
    monthly_credits_used INTEGER DEFAULT 0,
    lifetime_credits_used INTEGER DEFAULT 0,

    -- Streaks & Engagement
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    total_messages_sent BIGINT DEFAULT 0,
    total_content_created BIGINT DEFAULT 0,

    -- Referrals
    referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
    referred_by UUID REFERENCES public.profiles(id),
    referral_count INTEGER DEFAULT 0,
    referral_earnings DECIMAL(10, 2) DEFAULT 0,

    -- Settings
    notifications_enabled BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT true,
    adult_content_enabled BOOLEAN DEFAULT false,

    -- Metadata
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences for personas and interactions
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Interaction preferences
    preferred_persona_types persona_type[] DEFAULT '{}',
    preferred_world_themes world_theme[] DEFAULT '{}',
    conversation_style TEXT DEFAULT 'balanced', -- casual, formal, flirty, professional
    response_length TEXT DEFAULT 'medium', -- short, medium, long

    -- Content preferences
    favorite_music_genres TEXT[] DEFAULT '{}',
    favorite_visual_styles TEXT[] DEFAULT '{}',

    -- Privacy
    share_creations_publicly BOOLEAN DEFAULT false,
    allow_ai_learning BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- ===========================================
-- PERSONAS (AI Characters)
-- ===========================================

CREATE TABLE public.personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Ownership
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL = system persona
    is_public BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    price_credits INTEGER DEFAULT 0,

    -- Identity
    name TEXT NOT NULL,
    persona_type persona_type NOT NULL,
    tagline TEXT,
    description TEXT,
    avatar_url TEXT,
    banner_url TEXT,

    -- Personality Configuration
    personality JSONB NOT NULL DEFAULT '{
        "traits": [],
        "speaking_style": "friendly",
        "emotional_range": "balanced",
        "humor_level": "moderate",
        "formality": "casual",
        "empathy_level": "high",
        "assertiveness": "moderate"
    }',

    -- Voice Configuration (ElevenLabs)
    voice_id TEXT,
    voice_name TEXT,
    voice_preview_url TEXT,
    voice_settings JSONB DEFAULT '{"stability": 0.5, "similarity_boost": 0.75}',

    -- System Prompt & Behavior
    system_prompt TEXT,
    example_messages JSONB DEFAULT '[]',
    greeting_message TEXT,

    -- Associated World
    default_world_id UUID,

    -- Stats
    total_conversations BIGINT DEFAULT 0,
    total_messages BIGINT DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's unlocked/purchased personas
CREATE TABLE public.user_personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,

    -- Customization
    nickname TEXT,
    custom_avatar_url TEXT,
    relationship_level INTEGER DEFAULT 1,
    affection_score INTEGER DEFAULT 0,

    -- Usage Stats
    total_messages BIGINT DEFAULT 0,
    last_interaction_at TIMESTAMPTZ,

    -- Settings
    is_favorite BOOLEAN DEFAULT false,
    notifications_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, persona_id)
);

-- ===========================================
-- WORLDS (Themed Environments)
-- ===========================================

CREATE TABLE public.worlds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Ownership
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL = system world
    is_public BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    price_credits INTEGER DEFAULT 0,

    -- Identity
    name TEXT NOT NULL,
    theme world_theme NOT NULL,
    tagline TEXT,
    description TEXT,

    -- Visuals
    thumbnail_url TEXT,
    banner_url TEXT,
    background_url TEXT,
    color_scheme JSONB DEFAULT '{"primary": "#8B5CF6", "secondary": "#EC4899", "accent": "#06B6D4"}',

    -- Atmosphere
    ambient_music_url TEXT,
    ambient_sounds JSONB DEFAULT '[]',

    -- World Configuration
    setting_description TEXT, -- Detailed world lore
    time_period TEXT,
    location TEXT,
    atmosphere TEXT, -- dark, bright, mysterious, romantic, etc.

    -- Story Elements
    available_scenarios JSONB DEFAULT '[]',
    available_locations JSONB DEFAULT '[]',
    special_events JSONB DEFAULT '[]',

    -- Stats
    total_visits BIGINT DEFAULT 0,
    total_time_spent BIGINT DEFAULT 0, -- in seconds
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's unlocked worlds
CREATE TABLE public.user_worlds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,

    -- Progress
    exploration_level INTEGER DEFAULT 1,
    discovered_locations JSONB DEFAULT '[]',
    completed_scenarios JSONB DEFAULT '[]',

    -- Stats
    total_visits INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0,
    last_visit_at TIMESTAMPTZ,

    is_favorite BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, world_id)
);

-- ===========================================
-- CONVERSATIONS & MESSAGES
-- ===========================================

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
    world_id UUID REFERENCES public.worlds(id) ON DELETE SET NULL,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,

    -- Context
    title TEXT,
    scenario TEXT,
    current_location TEXT,
    mood TEXT,

    -- Stats
    message_count INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,

    -- Message Content
    role message_role NOT NULL,
    content TEXT NOT NULL,

    -- Rich Content
    attachments JSONB DEFAULT '[]', -- images, audio, etc.
    generated_content_id UUID, -- link to generated content

    -- AI Metadata
    model TEXT,
    tokens_used INTEGER DEFAULT 0,
    generation_time_ms INTEGER,

    -- Emotions & Analysis
    detected_emotions JSONB DEFAULT '[]',
    sentiment_score DECIMAL(3, 2),

    -- User Interaction
    is_edited BOOLEAN DEFAULT false,
    is_regenerated BOOLEAN DEFAULT false,
    reaction TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- MEMORY SYSTEM
-- ===========================================

CREATE TABLE public.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,

    -- Memory Content
    memory_type TEXT NOT NULL, -- fact, preference, event, emotion, relationship
    content TEXT NOT NULL,
    summary TEXT,

    -- Vector Embedding for Semantic Search
    embedding vector(1536),

    -- Importance & Relevance
    importance_score DECIMAL(3, 2) DEFAULT 0.5,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,

    -- Source
    source_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    source_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    expires_at TIMESTAMPTZ, -- for temporary memories
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX memories_embedding_idx ON public.memories
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ===========================================
-- AI CONTENT GENERATION
-- ===========================================

CREATE TABLE public.generated_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Type & Status
    content_type content_type NOT NULL,
    status generation_status DEFAULT 'pending',

    -- Input
    prompt TEXT NOT NULL,
    style TEXT,
    parameters JSONB DEFAULT '{}',

    -- Output
    result_url TEXT,
    result_urls JSONB DEFAULT '[]', -- for multiple outputs
    thumbnail_url TEXT,
    duration_seconds INTEGER, -- for audio/video

    -- Provider Info
    provider TEXT NOT NULL, -- suno, runway, replicate, openai, etc.
    provider_job_id TEXT,
    model TEXT,

    -- Costs
    credits_used INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10, 4),

    -- Processing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,

    -- Sharing
    is_public BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,

    -- Metadata
    title TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SUBSCRIPTIONS & PAYMENTS
-- ===========================================

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Subscription Details
    tier subscription_tier NOT NULL,
    status subscription_status NOT NULL,

    -- Payment Provider
    provider TEXT NOT NULL, -- stripe, revenuecat, apple, google
    provider_subscription_id TEXT,
    provider_customer_id TEXT,

    -- Pricing
    price_amount DECIMAL(10, 2) NOT NULL,
    price_currency TEXT DEFAULT 'USD',
    billing_interval TEXT DEFAULT 'month', -- month, year

    -- Dates
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Purchase Details
    purchase_type purchase_type NOT NULL,
    item_id UUID, -- persona_id, world_id, etc.
    item_name TEXT,

    -- Payment
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    credits_amount INTEGER, -- if credits purchase

    -- Provider
    provider TEXT NOT NULL, -- stripe, revenuecat
    provider_transaction_id TEXT,

    -- Status
    status TEXT DEFAULT 'completed',
    refunded BOOLEAN DEFAULT false,
    refunded_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Transaction Details
    amount INTEGER NOT NULL, -- positive = add, negative = spend
    balance_after INTEGER NOT NULL,

    -- Source
    source TEXT NOT NULL, -- purchase, subscription, referral, bonus, usage
    source_id UUID, -- purchase_id, generated_content_id, etc.
    description TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- REFERRALS
-- ===========================================

CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Status
    status TEXT DEFAULT 'pending', -- pending, converted, rewarded

    -- Rewards
    referrer_credits_earned INTEGER DEFAULT 0,
    referred_credits_earned INTEGER DEFAULT 0,
    referrer_paid BOOLEAN DEFAULT false,

    -- Metadata
    converted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(referred_id)
);

-- ===========================================
-- DAILY REWARDS & STREAKS
-- ===========================================

CREATE TABLE public.daily_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Reward Details
    day_number INTEGER NOT NULL, -- day in streak
    reward_type TEXT NOT NULL, -- credits, world, persona, voice, outfit, boost
    reward_id UUID, -- specific item if applicable
    reward_amount INTEGER, -- credits amount if applicable

    -- Status
    claimed BOOLEAN DEFAULT false,
    claimed_at TIMESTAMPTZ,

    -- Metadata
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.boosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Boost Details
    boost_type TEXT NOT NULL, -- unlimited_chat, double_credits, premium_models, etc.
    multiplier DECIMAL(3, 2) DEFAULT 1.0,

    -- Duration
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Source
    source TEXT, -- purchase, daily_reward, referral, promo

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ANALYTICS & EVENTS
-- ===========================================

CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Event Details
    event_name TEXT NOT NULL,
    event_category TEXT, -- engagement, conversion, feature, error

    -- Properties
    properties JSONB DEFAULT '{}',

    -- Context
    session_id TEXT,
    device_type TEXT,
    platform TEXT, -- web, ios, android
    app_version TEXT,

    -- Location
    country TEXT,
    region TEXT,
    city TEXT,

    -- Attribution
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partitioned for performance
CREATE INDEX analytics_events_user_id_idx ON public.analytics_events(user_id);
CREATE INDEX analytics_events_event_name_idx ON public.analytics_events(event_name);
CREATE INDEX analytics_events_created_at_idx ON public.analytics_events(created_at);

-- ===========================================
-- ADMIN & MODERATION
-- ===========================================

CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'moderator', -- super_admin, admin, moderator
    permissions JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

CREATE TABLE public.content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Reported Content
    content_type TEXT NOT NULL, -- message, persona, world, generated_content
    content_id UUID NOT NULL,

    -- Report Details
    reason TEXT NOT NULL,
    description TEXT,

    -- Status
    status TEXT DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
    reviewed_by UUID REFERENCES public.admin_users(id),
    reviewed_at TIMESTAMPTZ,
    resolution TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- PUSH NOTIFICATIONS
-- ===========================================

CREATE TABLE public.push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    token TEXT NOT NULL,
    platform TEXT NOT NULL, -- ios, android, web
    device_id TEXT,

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, token)
);

CREATE TABLE public.scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Notification Content
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',

    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,

    -- Type
    notification_type TEXT NOT NULL, -- persona_message, daily_reward, streak_reminder, etc.

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON public.personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_worlds_updated_at BEFORE UPDATE ON public.worlds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON public.memories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);

    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update message count on conversation
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET message_count = message_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_message_count();

-- Handle referral conversion
CREATE OR REPLACE FUNCTION process_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
    referrer_bonus INTEGER := 500;
    referred_bonus INTEGER := 200;
BEGIN
    IF NEW.status = 'converted' AND OLD.status = 'pending' THEN
        -- Award credits to referrer
        UPDATE public.profiles
        SET credits_balance = credits_balance + referrer_bonus,
            referral_count = referral_count + 1
        WHERE id = NEW.referrer_id;

        -- Award credits to referred user
        UPDATE public.profiles
        SET credits_balance = credits_balance + referred_bonus
        WHERE id = NEW.referred_id;

        -- Record transactions
        INSERT INTO public.credit_transactions (user_id, amount, balance_after, source, source_id, description)
        SELECT NEW.referrer_id, referrer_bonus, credits_balance, 'referral', NEW.id, 'Referral bonus'
        FROM public.profiles WHERE id = NEW.referrer_id;

        INSERT INTO public.credit_transactions (user_id, amount, balance_after, source, source_id, description)
        SELECT NEW.referred_id, referred_bonus, credits_balance, 'referral', NEW.id, 'Welcome bonus from referral'
        FROM public.profiles WHERE id = NEW.referred_id;

        -- Update referral record
        NEW.referrer_credits_earned := referrer_bonus;
        NEW.referred_credits_earned := referred_bonus;
        NEW.converted_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_referral_converted
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW EXECUTE FUNCTION process_referral_reward();

-- Semantic memory search function
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
    importance_score DECIMAL,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.content,
        m.summary,
        m.memory_type,
        m.importance_score,
        1 - (m.embedding <=> query_embedding) as similarity
    FROM public.memories m
    WHERE m.user_id = p_user_id
        AND (p_persona_id IS NULL OR m.persona_id = p_persona_id)
        AND m.embedding IS NOT NULL
        AND 1 - (m.embedding <=> query_embedding) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ language 'plpgsql';

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Personas policies
CREATE POLICY "Users can view public personas" ON public.personas FOR SELECT USING (is_public = true OR user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can create own personas" ON public.personas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personas" ON public.personas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own personas" ON public.personas FOR DELETE USING (auth.uid() = user_id);

-- User personas policies
CREATE POLICY "Users can view own user_personas" ON public.user_personas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own user_personas" ON public.user_personas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_personas" ON public.user_personas FOR UPDATE USING (auth.uid() = user_id);

-- Worlds policies
CREATE POLICY "Users can view public worlds" ON public.worlds FOR SELECT USING (is_public = true OR user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can create own worlds" ON public.worlds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own worlds" ON public.worlds FOR UPDATE USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in own conversations" ON public.messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can create messages in own conversations" ON public.messages FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- Memories policies
CREATE POLICY "Users can view own memories" ON public.memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own memories" ON public.memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memories" ON public.memories FOR UPDATE USING (auth.uid() = user_id);

-- Generated content policies
CREATE POLICY "Users can view own content" ON public.generated_content FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can create own content" ON public.generated_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content" ON public.generated_content FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Purchases policies
CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);

-- Credit transactions policies
CREATE POLICY "Users can view own credit_transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- Push tokens policies
CREATE POLICY "Users can manage own push_tokens" ON public.push_tokens FOR ALL USING (auth.uid() = user_id);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX profiles_subscription_tier_idx ON public.profiles(subscription_tier);
CREATE INDEX profiles_referral_code_idx ON public.profiles(referral_code);
CREATE INDEX personas_type_idx ON public.personas(persona_type);
CREATE INDEX personas_is_public_idx ON public.personas(is_public) WHERE is_public = true;
CREATE INDEX worlds_theme_idx ON public.worlds(theme);
CREATE INDEX worlds_is_public_idx ON public.worlds(is_public) WHERE is_public = true;
CREATE INDEX conversations_user_persona_idx ON public.conversations(user_id, persona_id);
CREATE INDEX conversations_last_message_idx ON public.conversations(last_message_at DESC);
CREATE INDEX messages_conversation_idx ON public.messages(conversation_id, created_at DESC);
CREATE INDEX memories_user_persona_idx ON public.memories(user_id, persona_id);
CREATE INDEX generated_content_user_idx ON public.generated_content(user_id, created_at DESC);
CREATE INDEX generated_content_status_idx ON public.generated_content(status) WHERE status = 'pending';
CREATE INDEX subscriptions_user_idx ON public.subscriptions(user_id);
CREATE INDEX boosts_user_active_idx ON public.boosts(user_id, expires_at) WHERE expires_at > NOW();
