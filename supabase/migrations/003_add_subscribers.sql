-- Email subscribers for the lead-magnet (AI Tool Selection Checklist) opt-in
-- on the homepage. Replaces the cold "Book a Call" path as the primary first
-- ask — gives us a low-friction "yes" we can warm into the NYClaw consultation
-- via email sequence later.
--
-- Design notes:
-- - email is unique → idempotent re-submits don't double-count or error visibly
-- - source column distinguishes future capture surfaces (homepage_checklist,
--   blog_inline, exit_intent, etc.) so we can attribute which lead magnet
--   actually pulls.
-- - referrer/utm_* captured for attribution; all nullable so the opt-in still
--   succeeds when the visitor lands without UTM params.
-- - RLS allows anonymous INSERT only — no public SELECT. Admin reads via the
--   service-role client on the admin panel.

CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'homepage_checklist',
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Future-proofing: when we ship the email sequence we'll flip these as the
  -- subscriber moves through the funnel.
  consultation_clicked_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX idx_subscribers_created_at ON subscribers(created_at DESC);
CREATE INDEX idx_subscribers_source ON subscribers(source);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Anon (unauthenticated visitor) can INSERT but not read. This mirrors the
-- `submissions` table policy used by the Submit-a-Tool form — public write,
-- private read.
CREATE POLICY "anon can insert subscribers"
  ON subscribers FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admin (service role) bypasses RLS — no explicit policy needed for reads.

COMMENT ON TABLE subscribers IS
  'Lead-magnet email opt-ins. Primary source: homepage AI Tool Selection Checklist. Funnels to NYClaw consultation via email sequence.';
