-- 005 — give `verified` a definition, a date, and a mechanism.
--
-- WHY: `verified` shipped in 001 as a bare boolean with no stated meaning and
-- no process behind it. In practice it got hand-set on 12 listings for being
-- recognizable brands. That is not verification, it is name recognition — and
-- the site rendered a green "Verified" badge off it, next to claims of manual
-- review and bar-compliance vetting. Meanwhile nine listings pointing at
-- domains with no DNS record at all sat published for ~3.5 months.
--
-- A trust badge that means nothing is worse than no badge: it converts the one
-- axis where a small directory can beat a large one (we actually checked) into
-- a liability. From here, `verified` means exactly one falsifiable thing:
--
--   "As of `verified_at`, an automated probe confirmed every URL on this
--    listing resolves."
--
-- That is narrow on purpose. It is not an endorsement, not a security review,
-- and not legal advice — those are claims we cannot back, which is how the
-- previous copy got into trouble. It IS something no competitor bothers to do,
-- it is cheap to maintain (scripts/curate.mjs verify), and it is checkable by
-- anyone who clicks the link.

ALTER TABLE listings
  -- Null = never confirmed. The UI shows the badge only when this is set, so
  -- the badge can never outlive the evidence for it.
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,

  -- Consecutive hard failures (DNS failure / 404 / 410). Bot-blocked responses
  -- (401/403/429) deliberately do NOT increment this — Clio sits behind
  -- Cloudflare and refuses scripted clients, and auto-unpublishing a live
  -- vendor because they blocked our user-agent would be its own accuracy bug.
  -- Requiring N consecutive failures rides out transient outages: pulling a
  -- real listing is a worse error than carrying one dead link for a week.
  ADD COLUMN IF NOT EXISTS link_failures SMALLINT NOT NULL DEFAULT 0;

-- Retire the 12 unearned flags. They were never the result of a check, so they
-- cannot be grandfathered — the next `curate.mjs verify` run re-earns every one
-- of them legitimately, with a date attached. Deliberately a clean reset rather
-- than a backfill: inventing a `verified_at` for a check that never ran would
-- reproduce the exact problem this migration exists to fix.
UPDATE listings SET verified = FALSE WHERE verified = TRUE;

COMMENT ON COLUMN listings.verified IS
  'Automated link-resolution check passed as of verified_at. Set only by scripts/curate.mjs verify — never by hand. Not an endorsement or a security/legal review.';
COMMENT ON COLUMN listings.verified_at IS
  'Timestamp of the last successful automated link check. NULL = never verified; the UI hides the badge in that case.';
COMMENT ON COLUMN listings.link_failures IS
  'Consecutive hard link failures (DNS/404/410). Bot-blocked (401/403/429) does not count. At 3, the listing is auto-unpublished.';

CREATE INDEX IF NOT EXISTS listings_verified_at_idx
  ON listings (verified_at DESC NULLS LAST)
  WHERE status = 'published';
