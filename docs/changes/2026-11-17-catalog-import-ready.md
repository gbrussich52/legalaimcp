# Catalog import made ready to run (2026-11-17)

Claude Sonnet 5.5, 2026-11-17. PREPARED, NOT RUN. Nothing was written to the production database, and the importer was not run with `--apply`. Applying it still needs Giani's yes.

Why: a read-only pre-check of the 2026-11-16 import (`docs/changes/2026-11-16-catalog-import-prep.md`) found three gaps. This change closes them.

## What changed, and what it was before
- `lib/catalog-reviews.json`: the three entries `clio`, `open-legal-compliance-mcp` and `courtlistener-mcp` are replaced by the records in `docs/changes/2026-11-16-catalog-import-reviews.json`, as the prep doc planned. Before: the 2026-10-27 records, which the importer refuses because they approve the old claims.
- `docs/changes/2026-11-16-catalog-import-reviews.json` (same records, edited the same way as above):
  - `reviewed_at` 2026-11-16 to 2026-11-17, because every source below was fetched and read again today.
  - Source `sha256` refreshed for three pages that changed between the 11-16 prep and today. Each was fetched twice with the same result. The quote was present in each, and the claim text was re-read against the page.
    - courtlistener-mcp `.../courtlistener-mcp/main/MCP_README.md`: `0de287dc...` to `a27c9205...` (four source entries share this URL).
    - clio `help.clio.com/.../9289741706779.json` (Time Entries, updated 2026-11-17 13:04Z): `4a2b3218...` to `9d715742...`.
    - clio `docs.developers.clio.com/guides/clio-manage/`: `03a5d0bc...` to `1afd5fc4...`.
  - clio `mcp_confirmed` true to false. The listing makes no MCP claim and no source here says Clio ships an MCP server; the 2026-10-27 record said false. The gate only needs it when a listing claims MCP, so this changes no result.
- `lib/supabase.ts`: `CATALOG_CACHE_REVISION` `2026-11-15-firecrawl-alexandria-url` to `2026-11-17-catalog-import` (prep doc step 1), so ISR does not reuse the old claims.
- No listing claim text changed. All three new claim sets were checked against their sources on 2026-11-17: every changed phrase is supported, so nothing was cut. `scripts/catalog-dead-sources-2026-11-16.json` is unchanged.

## Gap 1: the import clears `verified`
`scripts/import-reviewed-catalog.mjs` writes `verified=false, verified_at=null` on every row it updates. `courtlistener-mcp` and `open-legal-compliance-mcp` are `verified=true` today (`verified_at` 2026-10-28 00:07:26+00); `clio` is already false. The 2026-11-16 prep tables and rollback SQL did not say so.
- Visitor effect after the import, until the link check runs again: the green "Links checked" pill disappears on those two listings (`app/components/VerifiedBadge.tsx:46` renders nothing unless both fields are set; used by `ListingCard.tsx:53`, `RoundupItem.tsx:45`, `app/servers/[slug]/page.tsx:189`); they sort after verified listings where `.order('verified')` runs (`app/categories/[slug]/page.tsx`, `app/best/[slug]/page.tsx:89`, `app/best/legal-mcp-servers/page.tsx:41`, `app/api/mcp/route.ts:143`); they lose the +1 "links verified" point (`lib/recommend.ts:52`) and the search tie-break (`lib/search.ts:94`); `/api/mcp` and the ChatGPT shortlist return `links_verified_at: null`; the category "N with verified links" count drops by up to two.
- Why the importer clears it: no comment says. The definition is in `VerifiedBadge.tsx` and `supabase/migrations/005_verified_provenance.sql`: the badge means an automated probe confirmed every URL on the listing resolved, on the date shown. These imports change URLs (new `mcp_repo_url` for courtlistener-mcp; new `external_url`, `mcp_repo_url`, `creator_url` for open-legal-compliance-mcp), so the old stamp no longer describes the listing. That reading is an inference.
- Way back: `node scripts/curate.mjs verify` (earns `verified=true` and `verified_at=now()` for every URL that resolves; `app/admin/actions.ts:130` says nothing else may set it), or the Monday weekly run (`scripts/weekly/run.sh`). It can run right after the import. All new URLs answered 200 when probed today. Not run here.
- Rollback now restores `verified` and `verified_at` (see the SQL files).

## Gap 2: review records
Merged (above). `validateImport(plan, gate, {checkSources: true})` from the importer, run against the live sources with no database and no env file, returned 3 corrections, 3 with approved review.

## Gap 3: courtlistener-mcp claim text
The merged CourtListener work (PR #32) points the source at the `courtlistener-mcp` repo README, and the 11-16 change note records an earlier wiki-page pass whose "stale" verdict was reversed at rebase. Read today: the README says "Accounts are free for individuals", documents an API-token credential for clients that cannot run OAuth, and says "Usage is bounded by CourtListener's API rate limits". The wiki page is silent on free accounts and tokens and does not contradict them. So both phrases ("free individual accounts", API-token authentication) are supported by the README and stay.

## SQL
Forward and rollback SQL, matched to these records, are in the scratchpad (`legalaimcp-catalog-forward.sql`, `legalaimcp-catalog-rollback.sql`). Not run.
