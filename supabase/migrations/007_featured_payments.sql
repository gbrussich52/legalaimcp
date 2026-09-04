-- 007 — paid Featured placements (30-day bump) + payment audit trail.
--
-- Featured already existed as a boolean sort/badge flag (editorial). This
-- migration adds expiry + Stripe ids so a purchased bump can auto-expire,
-- while manual admin featured (featured=true, featured_until IS NULL) remains
-- an indefinite editorial placement.
--
-- MCP search stays free; featured only affects sort order and the badge.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS featured_purchased_at TIMESTAMPTZ;

COMMENT ON COLUMN listings.featured_until IS
  'When a paid Featured bump expires. NULL with featured=true = editorial indefinite. NULL with featured=false = not featured.';
COMMENT ON COLUMN listings.stripe_checkout_session_id IS
  'Most recent Stripe Checkout Session id that granted Featured.';
COMMENT ON COLUMN listings.stripe_payment_intent_id IS
  'Most recent Stripe PaymentIntent id for a Featured purchase.';
COMMENT ON COLUMN listings.featured_purchased_at IS
  'When the most recent paid Featured bump was applied.';

CREATE INDEX IF NOT EXISTS idx_listings_featured_until
  ON listings (featured_until)
  WHERE featured = TRUE AND featured_until IS NOT NULL;

CREATE TABLE IF NOT EXISTS listing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL,
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT listing_payments_stripe_session_id_key UNIQUE (stripe_session_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_payments_listing_id
  ON listing_payments (listing_id);

ALTER TABLE listing_payments ENABLE ROW LEVEL SECURITY;
-- No public policies: service-role (webhook/admin) only.

COMMENT ON TABLE listing_payments IS
  'Audit log of Stripe Featured purchases. Idempotent on stripe_session_id.';
