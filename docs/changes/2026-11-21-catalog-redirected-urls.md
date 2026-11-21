# Two listings: redirected link targets (import 3, 2026-11-21)

Claude Sonnet 5.5, 2026-11-21, checked by Claude Fable 5.2. The owner approved these changes. APPLIED 2026-11-21 14:15 UTC as import 3 (firecrawl-gov-index, supabase-legal-mcp). Claude Fable 5.2 ran the guarded SQL through the database confirm prompt with Giani's yes and read the rows back: each listing matches its review record.

Two published listings link to addresses that now redirect. Each change was checked against the live redirect today. No other word of either listing changes.

Stacked on `strict/catalog-rereview-2026-11-17` (imports 1 and 2), rebased onto origin/main b3f37d1 with no conflicts.

## What changed

| Listing | Field | Before | After |
| --- | --- | --- | --- |
| firecrawl-gov-index | external_url | https://alexandria.firecrawl.dev/firecrawl-gov-index | https://alexandria.firecrawl.dev/providers/firecrawl-gov-index |
| supabase-legal-mcp | mcp_repo_url | https://github.com/supabase-community/supabase-mcp | https://github.com/supabase/mcp |

The Supabase `external_url` (https://supabase.com/docs/guides/ai-tools/mcp) returns 200 with no redirect, so it stays.

open-legal-compliance-mcp is not part of this import. Its handle change (TCoder920x to TCoder920 in the repo URLs, creator name, creator URL and the first words of the description) ships in import 1 of the 2026-11-17 bundle. Its review record on this branch has `listing_sha256` ae9a3915aea89234a4d0c2ddc43dd437e336cd16ffe462d8aa348a232364825a, the same hash this review computed independently from the live row and the new handle.

## Why

- Firecrawl: the old Alexandria path returns 301 to the `/providers/` path. Both end on the same page, "Government & Legal Index API for AI agents | Firecrawl Alexandria".
- Supabase: `supabase-community/supabase-mcp` returns 301 to `supabase/mcp`. The new repo is owned by the `supabase` organization and serves the same README text.

## Review evidence

Every recorded source was read again today with the repo's own `sourceFingerprint`. All claims still hold and every stored quote is present.

- Firecrawl: `docs.firecrawl.dev/features/gov.md` is unchanged. `www.firecrawl.dev/gov-index` changed since 11-17, so its hash moved. `docs.firecrawl.dev/mcp-server.md` matches the 11-17 hash. The page still lists the API route, `firecrawl_gov_search`, the CLI, the SDKs and the connectors, says searching is free and that adding Firecrawl to Claude or ChatGPT takes a free account.
- Supabase: the README text is the same at both repo URLs. It and the docs page changed since 11-17, so both hashes moved. The README still says it connects assistants to a project for managing tables, fetching config and querying data. The docs page still documents project scoping, read-only mode, feature groups, the security warning and paid-plan features. The README source URL moves to `supabase/mcp`.

Both records carry reviewed_at 2026-11-21. Not a fingerprinted source: the Alexandria page, because it prints live counts and latency.

## Source hash refresh on 12 other records

The simulated source audit of this branch against today's pages found 15 records with drifted pages. For 12, every claim still holds and every quote is present, so only the source hash changed (reviewed_at and reviewer unchanged): claude-legal, cocounsel, composio-legal-toolkit, courtlistener-mcp, harvey-ai, imanage-work, invoice-my-clients-mcp, kira-systems, luminance, regulationsgov-mcp, relativity, smith-ai. This check compared each listing's claim terms with the page text; it was not a line-by-line re-review.

Three records were not refreshed and still fail the audit:
- diligent-compliance: the stored quote is gone from www.diligent.com.
- ironclad: the help-center article behind the second source now returns 404, and its quote is gone.
- pdf-reader-mcp: the README no longer describes a hosted metered parsing service, so the pricing_details claim is unsupported.

These three need an owner read.

## How it is applied

1. The SQL is `forward-3.sql` (rollback `rollback-3.sql`, read-only pre-check `guard-3.sql`) in `docs/ops/legalaimcp-import-2026-11-17/`. The importer equivalent is `node --env-file=.env.local scripts/import-reviewed-catalog.mjs scripts/catalog-redirected-urls-2026-11-21.json` run from this branch, since it reads `lib/catalog-reviews.json` from the working tree.
2. Read every target back, then run `npm run build` and `npm run catalog:verify`.

`CATALOG_CACHE_REVISION` moved to `2026-11-21-catalog-import`.

## Not tested

Account access, the connectors, search completeness, and deployed operation of either product. Link checks and source reads only. The SQL was not parsed by a database.
