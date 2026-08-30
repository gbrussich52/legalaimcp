-- 006 — firm_size_fit, for the recommend_legal_ai_tools MCP tool.
--
-- WHY: Glama rejected a manual MCP-server submission (2026-08-29) on the
-- grounds that the existing tools only do static directory lookups, not real
-- work. This column feeds a recommendation tool that actually scores tools
-- against a firm's practice area + size — see lib/recommend.ts.
--
-- Backfilled by a PRICING-based heuristic, not hand-classified per listing —
-- we don't have verified firm-size-fit data for 45 third-party products, and
-- asserting it as fact would repeat exactly the "unbacked claim" mistake
-- migration 005 exists to fix. The heuristic (free/freemium skews toward
-- solo/small budgets, contact-pricing usually means enterprise sales motion)
-- is a reasonable prior, not a verified claim, so it is NOT surfaced as a
-- badge or fact to end users — it only feeds a ranking, same epistemic tier
-- as the ranking itself.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS firm_size_fit TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN listings.firm_size_fit IS
  'Which firm sizes (solo|small|mid|large) this tool fits, for recommend_legal_ai_tools scoring. Heuristic prior from pricing_model at backfill time (see migration 006), refinable by hand later — not a verified claim, never rendered as a badge.';

UPDATE listings SET firm_size_fit = CASE pricing_model
  WHEN 'free'     THEN ARRAY['solo', 'small']
  WHEN 'freemium' THEN ARRAY['solo', 'small', 'mid']
  WHEN 'paid'     THEN ARRAY['small', 'mid']
  WHEN 'contact'  THEN ARRAY['mid', 'large']
  ELSE '{}'
END
WHERE firm_size_fit = '{}';

CREATE INDEX IF NOT EXISTS listings_firm_size_fit_idx ON listings USING GIN (firm_size_fit);
