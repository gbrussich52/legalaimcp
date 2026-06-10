-- Q4 (Wave 2): composite index for the browse query.
--
-- /servers, /categories/[slug], and the homepage featured grid all filter on
-- status = 'published' and order by featured DESC, name ASC. Without this
-- index Postgres seq-scans listings and sorts on every uncached request.
--
-- NOT YET APPLIED — apply via `supabase db push` (or dashboard SQL editor)
-- during the next deploy window. Safe to apply online: CREATE INDEX on a
-- ~54-row table completes instantly; IF NOT EXISTS makes it idempotent.

CREATE INDEX IF NOT EXISTS idx_listings_status_featured_name
  ON listings (status, featured DESC, name ASC);
