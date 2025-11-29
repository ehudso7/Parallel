-- ===========================================
-- PARALLEL - Webhook Events Table (Idempotency)
-- ===========================================

-- Create webhook_events table for tracking processed Stripe webhooks
-- This prevents duplicate processing of the same event

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast event_id lookups (idempotency checks)
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);

-- Index for querying by event type (analytics/debugging)
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);

-- Index for cleanup queries (delete old events)
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Add comment for documentation
COMMENT ON TABLE webhook_events IS 'Tracks processed Stripe webhook events for idempotency';
COMMENT ON COLUMN webhook_events.event_id IS 'Stripe event ID (evt_xxx)';
COMMENT ON COLUMN webhook_events.event_type IS 'Stripe event type (e.g., checkout.session.completed)';
COMMENT ON COLUMN webhook_events.processed_at IS 'When the event was successfully processed';

-- Optional: Add RLS policy if needed (webhook routes use service role key)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to webhook_events" ON webhook_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Create a cleanup function to remove old events (> 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_events
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_webhook_events IS 'Removes webhook events older than 30 days. Call periodically via cron.';
