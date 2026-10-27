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

Each approved record has `slug`, `decision: "approved"`, `reviewed_at` (YYYY-MM-DD), `reviewer`, `listing_sha256`, `identity_confirmed: true`, `capabilities_confirmed: true`, `mcp_confirmed` (required true for MCP claims), and `sources: [{url, kind: "vendor" | "maintainer", sha256, quote}]`. At most five sources per review. The listing hash binds all public claim fields listed in `FIELDS`, including pricing, tags, creator attribution and installation command. Check the *final normalized admin candidate*, including creator attribution, rather than the original submission alone.

The initial genuine positive control is iManage Work: its exact public claims were reviewed against the vendor's connector instructions and product page on 2026-10-27. A real network admission check passed against both sources without writing a catalog row. This verifies the evidence path, not customer-account authentication or an installed integration.

## Existing catalog and privileged operations

Older published listings are **not grandfathered into a capability-reviewed claim**. The visible badge says “Links checked”; it does not certify content. Their primary-source review remains an explicit backlog. No entry is bulk approved because it existed before this gate. Republishing any of them requires the same new evidence as a new submission.

Direct service-role/SQL writes are privileged maintenance outside the normal admin admission gate. Operators must use the same review before any such publication or substantive public-copy change; this change does not claim a database-level trigger. The build additionally rejects artifacts for quarantined slugs. Do not bypass either gate by changing a slug or renaming a product. Database-wide enforcement can be added separately with migration review; no schema, grant or RLS change is part of this correction.

## Known misattribution, 2026-10-27

The former `deadlinewatch-mcp` record described an AI court-deadline/statute-of-limitations MCP and linked to an unrelated deadline tracker. The operator confirmed it has no AI, MCP server or court-deadline calculation. The public website independently identifies the operator and says data is never sent to a language model. The record was moved to `pending_review`, its external URL cleared, and its link badge removed. `blocked_slugs` and `blocked_domains` prevent accidental readmission, including a different slug using that domain. The GitHub mirror also requires removal. No replacement product or affiliation is inferred.

The row was created in an April 8 import batch and marked `source=curated`. The available row and current repository history do not establish which agent or import command wrote it. Today's discovery script proposes GitHub candidates into submissions; it does not auto-publish them. Do not attribute the old write to that script without evidence.

## Verification and subtraction

`npm test` covers missing evidence despite HTTP 200, exact approved copy, altered capabilities/URLs/prices/commands, stale/future dates, source changes, failed source reads, non-primary evidence, missing supporting excerpts, domain aliases and both admin write boundaries. `npm run build` additionally rejects a published static artifact for the quarantined slug. Verify the actual public detail, search, sitemap and MCP output before replying to a reported correction.

This gate replaces link uptime as an admission shortcut. It extends the existing admin/verification paths, adds no scheduler or paid model, and does not automatically delete unrelated listings. Net growth is justified by the observed product misattribution; the source-controlled review is the durable approval record rather than a second spreadsheet or unenforced chat rule.
