# Catalog admission: prove the product and the claims

The directory describes software. A successful HTTP request establishes only link reachability. A real brand, a similar name, search snippet, directory entry, AI-generated description or Registry entry does not establish the advertised capabilities or an MCP connector.

## Publication gate

Both normal admin publication paths (`approveSubmission` and republishing with `updateListingStatus`) call `assertCatalogReview` before writing. Review records live in source-controlled `lib/catalog-reviews.json`, outside vendor-submitted data. Missing evidence, changed copy or URLs, unreadable/changed primary sources and reviews older than 90 days block publication. No model can mark its own generated listing approved through a submission. Discoveries continue to enter the pending queue, never the public catalog.

For each candidate the reviewing operator must:

1. Identify the actual product and operator on the vendor website or maintainer repository. Match the destination to that product, not a similarly named company. Distinguish official vendor connectors from community implementations.
2. Check **every substantive claim** in name, tagline, description, tags, pricing and install instructions against primary documentation or code. Collect short supporting excerpts and source URLs. Remove anything unsupported, including invented install commands, performance numbers and legal workflow capabilities. A general tool can be useful to firms without being a purpose-built legal product.
3. For an MCP claim, require actual MCP documentation or implementation from that vendor/maintainer. An article about MCP, a generic category page, a marketing use case or a non-MCP API does not suffice. Do not claim customer-account compatibility or successful operation unless that was separately tested.
4. Read the sources for contradictions. An automated keyword/quote match is not semantic validation. Record the named reviewer, date, explicit identity/capability/MCP decisions and a fingerprint of the exact final listing using `catalogFingerprint`. Retain a supporting quote and `sourceFingerprint` for each primary source. These functions in `lib/catalog-review.ts` define the canonical hash algorithms. The source hash ignores scripts, style, markup and repeated whitespace; changed meaningful source text requires a fresh review.
5. Check in the reviewed record through normal code review. On publication, the server re-fetches only those trusted recorded sources, with a timeout, two MB bound, HTTPS and no redirects. Every fingerprint and excerpt must still match. A changed or unavailable source remains blocked; never regenerate its hash automatically to turn the check green.

Each approved record has `slug`, `decision: "approved"`, `reviewed_at` (YYYY-MM-DD), `reviewer`, `listing_sha256`, `identity_confirmed: true`, `capabilities_confirmed: true`, `mcp_confirmed` (required true for MCP claims), and `sources: [{url, kind: "vendor" | "maintainer", sha256, quote}]`. At most five sources per review. The listing hash binds all public claim fields listed in `CATALOG_CLAIM_FIELDS`, including pricing, tags, creator attribution and installation command. Check the *final normalized admin candidate*, including creator attribution, rather than the original submission alone.

The initial genuine positive control is iManage Work: its exact public claims were reviewed against the vendor's connector instructions and product page on 2026-10-27. A real network admission check passed against both sources without writing a catalog row. This verifies the evidence path, not customer-account authentication or an installed integration.

## Complete audit and database enforcement — 2026-10-27

All 59 existing records were dispositioned: 42 source-backed products retain publication, eight records are pending verification, and nine historical rejected records remain unpublished. Unsupported public capabilities, prices, installer commands, legal specialization, attribution and performance/security guarantees were removed. No entry was approved merely because it existed. Unknown firm-size suitability is now an empty array rather than a guessed recommendation signal. The display identities for the generic CanLII and Clio-matter entries explicitly name the actual reviewed community maintainers; legacy URL slugs are retained for continuity, not as product-ownership claims.

The shared database now enforces admission for privileged/bulk operations as well as admin publication. The canonical migration is `property-appraisal-pro/supabase/migrations/20261027000001_legalaimcp_catalog_admission.sql` (the database-owning repository). New rows default to pending review. A trigger binds publication and public-claim changes to a dated exact-payload record in the private `legalaimcp.catalog_reviews` ledger. Identity, description, URLs, prices, instructions, tags, creator, logo and firm-size fields are bound. Unpublishing revokes approval; republication needs a newly staged current review. Routine link checks and payment/placement bookkeeping do not rewrite product claims and remain operational.

The trusted application validates the checked-in review and current primary sources before staging its ledger record. A database owner can alter the schema, and a trusted service-role holder can forge approval metadata, so these remain explicit trust boundaries. The trigger prevents accidental direct-import bypass; PostgreSQL is not an automated judge of natural-language truth.

## Atomic corrections and recurring source checks

Use `node --env-file=.env.local scripts/import-reviewed-catalog.mjs PLAN.json` for a read-only preflight. Each item must bind `id`, `expected_status`, `expected_claims` and its final `listing`. Publication requires a matching checked-in approval. Quarantines require an explicit blocked-slug decision. The command does not accept an approval supplied by a vendor/import file in place of the trusted registry. It cannot delete records.

`--rollback-test` exercises the full SQL transaction and rolls back. `--apply` commits only after current source checks pass. The SQL transaction locks each target and compares both prior claims and status, so a concurrent quarantine or content correction aborts the entire batch. Approval staging, corrections and revocations happen atomically. Only reviewed public fields change; IDs, payment history and placement bookkeeping are preserved. Always read every target back after commit. Data is safely dollar-quoted with randomized delimiters; fetched content is never executed.

On a reviewed bulk release, bump `CATALOG_CACHE_REVISION` in `lib/supabase.ts`. It uses the existing SDK client-info header to distinguish public-read caches while retaining the five-minute freshness bound. The build checks actual generated evidence cards for every approved product and rejects any quarantined product artifact. The October27 build correctly caught stale pre-correction cached claims; the check was retained and the cache revision corrected.

The existing `curate.mjs verify` path now calls the same source-review gate before link refreshes. `catalog:verify` runs it on demand. The sensor checks exact published copy, review age and live source snapshots, writes `catalog-health.json`, and records failed products in `catalog-improve.md`. It never edits claims or refreshes review dates automatically. Four workers, at most 100 listings/unique-source requests, 12-second individual fetches, 180-second overall fetch deadline and a 64 MB aggregate response bound keep work finite. Sources are public vendor/maintainer pages; no client documents, private accounts or remote inference are involved. This extends the registered Monday job rather than adding a timer. Installed/signed-loop state and observed manual runs are recorded separately in the estate release handoff.

## Known misattribution, 2026-10-27

The former `deadlinewatch-mcp` record described an AI court-deadline/statute-of-limitations MCP and linked to an unrelated deadline tracker. The operator confirmed it has no AI, MCP server or court-deadline calculation. The public website independently identifies the operator and says data is never sent to a language model. The record was moved to `pending_review`, its external URL cleared, and its link badge removed. `blocked_slugs` and `blocked_domains` prevent accidental readmission, including a different slug using that domain. The GitHub mirror removal was verified, and the full mirror is regenerated from the corrected approved claims. No replacement product or affiliation is inferred.

The row was created in an April 8 import batch and marked `source=curated`. The available row and current repository history do not establish which agent or import command wrote it. Today's discovery script proposes GitHub candidates into submissions; it does not auto-publish them. Do not attribute the old write to that script without evidence.

## Verification and subtraction

`npm test` covers missing evidence despite HTTP 200, exact approved copy, altered capabilities/URLs/prices/commands, stale/future dates, source changes, failed source reads, non-primary evidence, missing supporting excerpts, domain aliases and both admin write boundaries. `npm run build` additionally rejects a published static artifact for the quarantined slug. Verify the actual public detail, search, sitemap and MCP output before replying to a reported correction.

This gate replaces link uptime as an admission shortcut. It extends the existing admin/verification paths, adds no scheduler or paid model, and does not automatically delete unrelated listings. Net growth is justified by the observed product misattribution; the source-controlled review is the durable approval record rather than a second spreadsheet or unenforced chat rule.


## October 29, 2026 — observed source drift and manual corrections

A fresh primary-source pass flagged nine changed listings. Manual claim-by-claim review confirmed eight products and corrected Vincent’s current Clio branding, narrowed its supported workflows, and bounded commercial terms to the official demo/trial pages. Invoice My Clients now scopes the absence of legal matter management to the reviewed documentation. Review dates reflect this actual review; no customer accounts, paid integrations, private documents, or legal-output accuracy were tested.

The subsequent read-only source check covered 42 products and 53 primary URLs with zero findings. The strict full-source fingerprint and exact-claim gate remain unchanged. Catalog imports bind the current before-state, validate every source, exercise the transaction with rollback first, and require full readback. These manual checks do not establish that the owner-gated weekly job ran. This entry extends the existing audit history; no schedule, model, or service was added.

The same release updates the supported SDK to1.32.2 and Zod to4.6.7, retaining the existing1.x MCP handler through a scoped peer override proven by HTTP interoperability tests; it avoids an unnecessary SDK2 architecture migration. A scoped compatible selector-parser6.1.5 override removes the typography package’s stale exact pin. Native full-tree audit and peer-resolution checks are clean. The previous iManage shortlist test incorrectly hardcoded October27 after the documented October28 review; its expected evidence date now matches that dated primary-source decision. The catalog cache revision changes so production cannot reuse pre-correction payloads. No security control or source gate is weakened.

## New listings from submissions

Claude Opus 5.5, 2026-11-22. The admin Approve button cannot publish a new listing: it needs a deployed review record, and the build refuses a record whose page does not exist yet. New listings go in through a guarded SQL pack and then a PR, the same way corrections do. Background: `docs/changes/2026-11-22-intake.md`.

1. Review each submission against primary sources and write a plan file outside the repo: `reviewed_at`, `reviewer`, `admit` items (submission ids, final listing, the three confirmations, 1 to 5 sources with verbatim quotes) and `reject` items (submission ids, plain notes).
2. Check: `node scripts/admit-submissions.mjs PLAN.json`. One PASS or FAIL line per item. It fetches every source the way the gate does and ends with the real `assertCatalogReview`. Fix every FAIL before going on. (`--no-fetch` runs only the static checks.) In the Claude sandbox, prefix `NODE_USE_ENV_PROXY=1` so Node's fetch uses the proxy.
3. Records: `node scripts/admit-submissions.mjs PLAN.json --write-records`. New records go into `lib/catalog-reviews.json` in slug order. It refuses to overwrite a slug that already has a record.
4. SQL: `node scripts/admit-submissions.mjs PLAN.json --sql OUT_DIR`. Writes `guard.sql`, `apply.sql`, `apply.rollback.sql` and `readback.sql`, all pure ASCII.
   The duplicate-site check compares the host, except on shared code hosts (GitHub, GitLab, Bitbucket, Codeberg, Hugging Face, npm, PyPI), where it compares host plus owner/repo.
5. The owner runs `guard.sql` and stops unless every boolean is true. Then `apply.rollback.sql` to exercise the trigger, then `apply.sql`, each through the confirm prompt.
6. The owner runs `readback.sql` and saves the result as JSON. Verify it: `node scripts/admit-submissions.mjs PLAN.json --verify-readback READBACK.json`.
7. Bump `CATALOG_CACHE_REVISION` in `lib/supabase.ts`.
8. `npm test`, then `npm run build`. The build now finds a page for every new record.
9. Open the PR with the records and the cache bump. Giani's merge ships it.

## Is this vendor real: realness checks and the operator field

Claude Sonnet 5.5, 2026-11-23. Zero trust: a vendor's own pages show what the vendor says, not that the vendor exists. The checks above compare claims with vendor pages. This step asks a different question, and it uses sources the vendor does not control.

`node scripts/realness.mjs --all --write --report` runs seven checks per listing and writes `lib/catalog-realness.json` (one record per slug: `level`, `reasons`, and the checks with a plain-words `observed` line and a `how_to_repeat` command a stranger can run).

| Check | What it looks at |
|---|---|
| `site` | The listing address answers (up to 5 redirects, https only). A redirect to another domain is a warning. HTTP 401, 403 and 429 mean the site blocks automated readers: `unknown`, never a fail. A 5xx is asked again once after 3 seconds. |
| `domain_age` | Registration date from the registry (RDAP). `.de` is not queried because the registry restricts automated use. Shared hosts such as github.com are marked not applicable, because their age says nothing about the vendor. |
| `mail` | The domain has mail (MX) records. |
| `security_resolver` | Internal alert only. The domain resolves on a plain resolver but not on a security resolver. |
| `mcp_endpoint` | Only when the listing names a remote MCP address. One `initialize` call; if the server does not know it, one `server/discover` call. Never any other method. A sign-in challenge counts as reachable. |
| `repo` | A GitHub repository exists, is not archived, and the date of its last push. |
| `registry` | An entry in the official MCP registry whose endpoint host or namespace matches. The registry confirms control of a namespace, not quality. Absence is `unknown`. |

Levels: `fail` if the site cannot be reached, the domain is under 30 days old, the security resolver blocks it, or a listed MCP address is gone. `watch` if the domain is under 180 days old, its registration date is unknown, it has no mail records, or the handshake could not be checked. Otherwise `pass`. A pass shows what was observed on that date. It does not mean the vendor is trustworthy.

`node scripts/realness.mjs --check` runs again and prints what changed against the committed file, without writing (for a daily job). `--plan PLAN.json` checks the admit items of an admission plan before they exist in the catalog. `--endpoint URL` runs one handshake against any MCP address.

### Gate on new listings

`scripts/admit-submissions.mjs` with `--write-records` or `--sql` refuses an admit item when:

1. its realness level is `fail` (no override);
2. its level is `watch` and the item has no `realness_ack`, a sentence of at least 10 characters giving the reason a person accepted it;
3. the item has no `operator` object.

`operator` answers "does the organisation exist in a public company register", and it must be answered even when the answer is no. Either `{ "name", "register", "url", "status", "checked_at" }` (the legal entity as found, with the register name, the https link to the entry, its status such as "Active", and the date you looked) or `{ "status": "not_found", "note": "where you searched and what you searched for" }`. Both are stored on the review record, with `realness_ack` when present. The 69 existing records do not carry `operator` and do not need it.

A plain check without the write flags still runs offline of this step, so you can see source problems first.
