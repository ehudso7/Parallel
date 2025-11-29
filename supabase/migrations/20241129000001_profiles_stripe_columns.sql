-- ===========================================
-- PARALLEL - Profile Stripe & Subscription Columns
-- ===========================================

-- Add Stripe and subscription columns to profiles table
-- These may already exist - using IF NOT EXISTS for safety

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 50;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_credits_used INTEGER DEFAULT 0;

-- Add index for faster Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Add index for subscription tier queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);

-- Add constraint for valid subscription tiers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_tier_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
      CHECK (subscription_tier IN ('free', 'basic', 'pro', 'unlimited', 'studio'));
  END IF;
END $$;

-- Add constraint for valid subscription status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
      CHECK (subscription_status IS NULL OR subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'paused'));
  END IF;
END $$;

COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for web payments';
COMMENT ON COLUMN profiles.subscription_tier IS 'Current subscription tier: free, basic, pro, unlimited, studio';
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription status from Stripe';
COMMENT ON COLUMN profiles.subscription_expires_at IS 'When the current subscription period ends';
COMMENT ON COLUMN profiles.credits_balance IS 'Current available credits balance';
COMMENT ON COLUMN profiles.monthly_credits_used IS 'Credits used in current billing period';
