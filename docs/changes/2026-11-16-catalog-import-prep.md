# Prepared catalog import: three live listing faults (2026-11-16)

Claude Sonnet 5.5, 2026-11-16. PREPARED, NOT RUN. Applying it writes to the production database, so it needs Giani's yes. Nothing in `lib/catalog-reviews.json` changed for these three claims, and no review date moved for them. Until the import runs, the live rows, `lib/catalog-reviews.json` and the build all agree with each other, and the build's catalog artifact check keeps passing.

## Files
- `scripts/catalog-dead-sources-2026-11-16.json`: the import plan. Same format as `scripts/catalog-firecrawl-alexandria-url.json`. Each item binds the row `id`, `expected_status`, `expected_claims` (the live row, read 2026-11-16 with the public anon key, identical to the approved review) and the new `listing`.
- `docs/changes/2026-11-16-catalog-import-reviews.json`: the three new review records (exact new claims, `listing_sha256`, sources with quotes and hashes, `reviewed_at` 2026-11-16). They replace the three matching entries in `lib/catalog-reviews.json` in the same commit that runs the import.
- `docs/changes/2026-11-16-catalog-import-rollback.sql`: the importer's own SQL with before and after swapped.

Dry check done today: with the three review records merged into a temporary copy of `lib/catalog-reviews.json`, `validateImport` returned "3 corrections, 3 with approved review" (exact-claim approval found, every source fetched, hash and quote matched). The file was then restored byte for byte. No database write, no database read other than the public listing rows.

## How it is applied (same path as the 2026-10-28, 10-29 and 11-15 corrections, see `docs/catalog-review.md` and `docs/changes/2026-11-15-firecrawl-alexandria-url.md`)
1. In one commit: replace the three entries in `lib/catalog-reviews.json` with those in `2026-11-16-catalog-import-reviews.json`, and bump `CATALOG_CACHE_REVISION` in `lib/supabase.ts`.
2. `node --env-file=.env.local scripts/import-reviewed-catalog.mjs scripts/catalog-dead-sources-2026-11-16.json` (read-only preflight, then `--rollback-test`, then `--apply`).
3. Read every target back; run `npm run build` (postbuild artifact check) and `npm run catalog:verify`.

## 1. courtlistener-mcp (id 249eb1f1-0f31-48b5-9acc-24a41c28fb61)
| Field | Before | After |
| --- | --- | --- |
| mcp_repo_url | https://github.com/freelawproject/courtlistener-api-client | https://github.com/freelawproject/courtlistener-mcp (returns 200) |
| pricing_details | The maintainer documents free individual accounts. Usage limits, memberships, document purchases and other charges depend on the service and account; confirm current terms. | The maintainer documents free individual accounts. Usage is bounded by CourtListener's API rate limits; confirm current terms. |
| description, last sentence of the middle | ...so inspect permissions and possible charges. | ...so inspect permissions before you approve. |

Backing, all in `https://raw.githubusercontent.com/freelawproject/courtlistener-mcp/main/MCP_README.md` (hash 0de287dc...):
- "Accounts are free for individuals"
- "Usage is bounded by CourtListener's API rate limits"
- "Nothing is charged to you, but fulfillment isn't immediate or guaranteed." (Pray and Pay; why "possible charges" and "document purchases" go)
- "These tools also modify your CourtListener account state" (why the permissions sentence stays)

`pricing_model` stays `freemium`: the README mentions a membership status in `get_api_usage` but does not describe paid tiers, so neither "free" nor a paid claim is backed. Revisit if CourtListener's own pricing page is added as a source.

## 2. open-legal-compliance-mcp (id e0a9ddad-3420-476d-a3cd-60da14c30ea6)
The GitHub owner renamed from TCoder920x to TCoder920. `https://github.com/TCoder920x` is 404; `https://github.com/TCoder920` returns 200; `https://github.com/TCoder920x/open-legal-compliance-mcp` redirects (301) to `https://github.com/TCoder920/open-legal-compliance-mcp`, which returns 200. `gh api repos/TCoder920x/open-legal-compliance-mcp` reports `full_name` TCoder920/open-legal-compliance-mcp.

| Field | Before | After |
| --- | --- | --- |
| creator_url | https://github.com/TCoder920x | https://github.com/TCoder920 |
| creator_name | TCoder920x | TCoder920 |
| external_url, mcp_repo_url | https://github.com/TCoder920x/open-legal-compliance-mcp | https://github.com/TCoder920/open-legal-compliance-mcp |
| description | "The TCoder920x repository documents..." | "The TCoder920 repository documents..." |

Source URL moves to the new owner path. The README text is unchanged: hash 7fa46101... on both old and new URLs, quote "The server will not start without this key." present.

## 3. clio (id a11b2cf2-d182-4abb-8821-8b0c09745479)
| Field | Before | After |
| --- | --- | --- |
| description, second sentence | Clio's Manage AI documentation describes recommendations for client communications, bills and suggested time entries from unlogged activity. | Clio's AI documentation describes drafted client communications, draft invoices and suggested time entries from unlogged activity. |

Backing (Clio help center articles, fetched as `/api/v2/help_center/en-us/articles/{id}.json`):
- draft invoices: 29764998990491, "The generated draft invoice is automatically routed to the specified approvers for review and final approval" (also "Clio's AI converts recorded entries into invoices").
- drafted client communications: 29658448391067, "recognizes when a client update is warranted"; the article says these drafts surface as AI Actions that the responsible staff review and send.
- suggested time entries from unlogged activity: 9289741706779, "help you proactively identify matter activity and suggest unlogged time entries".
- "Manage AI" is no longer the name used in the current articles (they say "Clio's AI features"), so the sentence drops it.

## Rollback
One line: send `docs/changes/2026-11-16-catalog-import-rollback.sql` through the same Management API call the importer uses (it is the importer's own SQL, one transaction, and refuses to run unless the three rows still hold the new claims), then `git revert` the commit that applied the review records. Rolling back through the importer itself is not possible: the old Clio and CourtListener review records cite sources that now return 404, so the gate would refuse them. The SQL path writes the old review evidence back into the ledger without re-fetching.

## Improve queue lines (also in `scripts/weekly/logs/improve-queue.md`, which is git-ignored)
- courtlistener-mcp: pricing text and MCP repository link are stale; prepared import `scripts/catalog-dead-sources-2026-11-16.json`, waits for Giani's yes.
- open-legal-compliance-mcp: creator owner renamed to TCoder920, creator_url 404; same import.
- clio: description says "recommendations for ... bills", vendor term is "draft invoices"; same import.

## Update 2026-11-17 (Claude Sonnet 5.5)
The import also clears `verified` and `verified_at` on every row it writes. `courtlistener-mcp` and `open-legal-compliance-mcp` are verified today, so both lose the "Links checked" badge until `node scripts/curate.mjs verify` or the Monday weekly run restores it; the rollback SQL now restores both fields. Review records are merged, dates and three source hashes refreshed. Details: `docs/changes/2026-11-17-catalog-import-ready.md`.
