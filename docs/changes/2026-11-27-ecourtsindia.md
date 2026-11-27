# 2026-11-27: eCourtsIndia MCP admitted

Claude Sonnet 5.5, 2026-11-27. Admits one pending submission as `/servers/ecourtsindia-mcp`.

## What changed

- `lib/catalog-reviews.json`: one new approved review record for `ecourtsindia-mcp`, with five vendor quotes, their page fingerprints, the listing claims and an operator block.
- `lib/catalog-realness.json`: one new record for `ecourtsindia-mcp` (level pass). The other records are unchanged; only `generated_at` moved.
- `lib/supabase.ts`: `CATALOG_CACHE_REVISION` is now `2026-11-27-intake-1` (was `2026-11-26-intake-2`) so cached catalog reads refresh after the apply.
- The SQL pack (guard, apply, rollback, readback) sits outside this repo, in the ops run folder. It is not applied yet. The owner applies it after reading the guard and the dry run.

## What the code and data did before

The catalog had no listing for eCourtsIndia. The submission stayed pending.

## Why

The vendor runs a remote MCP server for Indian court data. The listing is in scope as a legal research source. Every claim on it is the vendor's, marked as such, or something we saw.

## What the review found

- Operator: Billion Insights Ventures Private Limited, CIN U62090UP2026PTC241369, status Active, formed 2026-01-15. Read on three public mirrors of India's company register (Falcon Ebiz, InstaFinancials, Tracxn). Google Play names the same company as developer of the eCourts India app. We did not use the MCA portal (it needs a CAPTCHA).
- Endpoint `https://mcp.ecourtsindia.com/mcp` answered with a sign-in request. We ran no tool. The listing says so.
- The vendor's pages disagree on the district court count (600+ on one page, 700+ on another), so the listing gives no district number. The listing does not use the vendor's founding-year claim.

## Open after the apply

`npm run build` has a post-build check that needs the listing row in production. It fails for this slug until the apply runs. That is expected.
