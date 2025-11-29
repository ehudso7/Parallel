-- ===========================================
-- PARALLEL - Atomic Credit Increment Function
-- ===========================================

-- Create atomic credit increment function to prevent race conditions
-- This is called by the webhook handler for credit purchases

CREATE OR REPLACE FUNCTION increment_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Atomically increment credits and return new balance
  UPDATE profiles
  SET
    credits_balance = credits_balance + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits_balance INTO new_balance;

  -- Return the new balance (or NULL if user not found)
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to deduct credits (for AI usage)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error_message TEXT) AS $$
DECLARE
  current_balance INTEGER;
  result_balance INTEGER;
BEGIN
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
    RETURN QUERY SELECT false, current_balance, 'Insufficient credits'::TEXT;
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

  RETURN QUERY SELECT true, result_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset monthly credits (called by subscription renewal webhook)
CREATE OR REPLACE FUNCTION reset_monthly_credits(
  p_user_id UUID,
  p_monthly_credits INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET
    credits_balance = p_monthly_credits,
    monthly_credits_used = 0,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_credits IS 'Atomically add credits to user balance (for purchases)';
COMMENT ON FUNCTION deduct_credits IS 'Atomically deduct credits from user balance (for AI usage)';
COMMENT ON FUNCTION reset_monthly_credits IS 'Reset credits on subscription renewal';
