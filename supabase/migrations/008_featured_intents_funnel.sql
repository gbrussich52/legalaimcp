-- 008 — Featured checkout recovery: intent capture before Stripe + first-party funnel log.
-- Claude Fable 5.2 (executor), 2026-11-15: three people left Stripe without an email and nothing was recorded.
-- Not applied by the branch. Apply by hand (see docs/changes/2026-11-15-featured-checkout-recovery.md).
-- Service role only: RLS on, no anon/authenticated policies, explicit grants below.

CREATE TABLE IF NOT EXISTS legalaimcp.featured_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  listing_id UUID NOT NULL REFERENCES legalaimcp.listings(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('works_here', 'agency', 'just_looking')),
  stripe_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'paid', 'expired', 'canceled')),
  cancel_reason TEXT CHECK (cancel_reason IN ('price', 'approval', 'detail', 'just_looking')),
  recovery_url TEXT,
  followed_up_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_featured_intents_status_created
  ON legalaimcp.featured_intents (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_featured_intents_session
  ON legalaimcp.featured_intents (stripe_session_id) WHERE stripe_session_id IS NOT NULL;

ALTER TABLE legalaimcp.featured_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON legalaimcp.featured_intents FROM anon, authenticated;
GRANT ALL ON legalaimcp.featured_intents TO service_role;

COMMENT ON TABLE legalaimcp.featured_intents IS
  'One row per Featured checkout start: work email, role, Stripe session, outcome. Contains email (PII): service role only.';

-- Funnel log: step names, slug, enum props. Never email, name, IP, user agent or free text.
CREATE TABLE IF NOT EXISTS legalaimcp.funnel_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  step TEXT NOT NULL CHECK (step IN (
    'featured_click', 'featured_intent_submitted', 'featured_stripe_redirect',
    'featured_cancel_reason', 'featured_paid', 'featured_expired')),
  slug TEXT,
  props JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_step_created
  ON legalaimcp.funnel_events (step, created_at);

ALTER TABLE legalaimcp.funnel_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON legalaimcp.funnel_events FROM anon, authenticated;
GRANT ALL ON legalaimcp.funnel_events TO service_role;

COMMENT ON TABLE legalaimcp.funnel_events IS
  'First-party funnel steps, kept out of third-party trackers. Slug and enum props only; no PII.';
