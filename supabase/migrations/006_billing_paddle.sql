-- ============================================
-- PADDLE BILLING INTEGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1) BILLING CUSTOMERS
-- Links Supabase users to Paddle customers
CREATE TABLE IF NOT EXISTS billing_customers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_customer_id TEXT UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('technician', 'company')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) SUBSCRIPTIONS
-- Tracks subscription status (source of truth from webhooks)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('technician', 'company')),
  plan_id TEXT NOT NULL, -- Internal plan key: TECH_MONTHLY, TECH_YEARLY, COMP_STARTER, etc.
  paddle_subscription_id TEXT UNIQUE,
  paddle_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'trialing', 'past_due', 'paused', 'canceled', 'expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) BILLING EVENTS
-- Stores raw webhook events for debugging and idempotency
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  paddle_event_id TEXT UNIQUE, -- For idempotency
  paddle_subscription_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  raw JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) INDEXES
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_id ON subscriptions(paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_paddle_id ON billing_events(paddle_event_id);

-- 5) ROW LEVEL SECURITY
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own billing customer record
CREATE POLICY "Users can read own billing customer" ON billing_customers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- No direct user updates to subscriptions (only via webhooks/service role)
-- Service role bypasses RLS automatically

-- Billing events are internal only (no user access)
-- Service role handles all billing_events operations

-- 6) FUNCTION TO UPDATE TIMESTAMP
CREATE OR REPLACE FUNCTION update_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at (only create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_billing_customers_updated_at') THEN
    CREATE TRIGGER update_billing_customers_updated_at
      BEFORE UPDATE ON billing_customers
      FOR EACH ROW EXECUTE FUNCTION update_billing_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
    CREATE TRIGGER update_subscriptions_updated_at
      BEFORE UPDATE ON subscriptions
      FOR EACH ROW EXECUTE FUNCTION update_billing_updated_at();
  END IF;
END
$$;

-- 7) HELPER VIEW: Active subscriptions with user info
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  s.id,
  s.user_id,
  s.role,
  s.plan_id,
  s.status,
  s.current_period_end,
  s.cancel_at_period_end,
  bc.paddle_customer_id,
  bc.email
FROM subscriptions s
JOIN billing_customers bc ON s.user_id = bc.user_id
WHERE s.status IN ('active', 'trialing');

