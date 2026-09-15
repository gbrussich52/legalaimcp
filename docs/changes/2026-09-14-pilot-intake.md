---
classification: PUBLIC
---
# AI workflow reliability pilot intake

Previously, visitors could prepare a free workflow plan or follow a general setup-help link, but could not request the proposed reliability pilot with concrete success and failure examples. `/pilot` now prepares a local brief, checks whether the answers fit a standard scope, and accepts an explicit opt-in into a private admin queue. The directory footer, MCP page, workflow planner and sitemap link to it.

The proposed package is one integration, up to five read-only checks and four weeks, at $250 setup plus $149 for the first month. These are validation prices, not demonstrated willingness to pay. Submission creates no payment, subscription, monitoring, endpoint request or outbound message. Qualification uses the visitor's answers; it is not a verified integration assessment.

The three-step form requires fictional examples and explicit storage/contact consent. Inputs stay in the page until the final send; downloading a brief does not submit it. Server validation independently checks consent and allowed fields. Failed persistence leaves the draft available and cannot produce a receipt. Editing the draft invalidates the previous review and download notice. `/admin/pilots` uses existing signed admin authentication and records status plus support minutes; blank means unknown, not zero. There is no invented paid or revenue state.

## Database and deployment

The sole schema source is the shared database repository, `property-appraisal-pro`, migration `supabase/migrations/20260914000001_legalaimcp_pilot_requests.sql`. Do not add a competing migration to this app's historical Supabase directory.

The migration adds one table and one restricted RPC in the existing `legalaimcp` schema. Anonymous/authenticated roles have no table or function access. The server uses the existing service-role secret; no new credential or metered service is required. Exact retries return the original receipt. Conflicting references are rejected. A transaction lock serializes quota checks: three per email, five per source and 100 total per UTC day. The source identifier is a daily keyed hash of Vercel's trusted client-address header; raw addresses are not persisted or logged. Distributed-source abuse remains possible. Quotas bound database growth but do not prevent request traffic.

Production intake requires the existing Supabase URL/service key and Vercel's trusted `x-vercel-forwarded-for` header. It fails closed off Vercel, with missing configuration, unavailable storage or invalid receipt responses. The proposed deployment uses the current Vercel project; a proxy change requires revisiting header provenance. Never put customer information or credentials in test fixtures, public artifacts or logs.

Release sequence, after production approval:

1. Confirm the current production app still uses the `legalaimcp` schema and the canonical migration has no conflicting remote version. Inspect the migration plan so unrelated pending migrations are not applied accidentally.
2. Apply only this additive pilot migration to the existing shared database. Recheck table and function grants and RLS. No data migration, database cutover, destructive command or other product change is part of this release.
3. Publish the app commit. Build with the established production configuration; a no-credentials local build has fewer directory pages and must not substitute for a complete production build.
4. Verify the pilot links and mobile form, an authorized fictional test submission and its matching private queue receipt, admin status/time updates, and anonymous access denial. Record the production URL and evidence. Do not interpret HTTP 200 as a saved request.
5. Review actual opt-ins, scoped requests, collected payments and measured support time separately. Register and validate any future scheduled customer monitoring before activation. Do not treat discovered servers or page visits as paying demand.

Rollback: revert the app release or disable the entry points while retaining the private table and submitted records. Do not drop the table as a routine rollback; records may need reconciliation first.

## Verification and operating limits

The existing `npm test` gate covers input/consent validation, endpoint boundaries, trusted source hashing, narrow persistence, receipt matching, unavailable storage, same-origin checks and admin authorization. The canonical database repository includes a standalone PostgreSQL-compatible PGlite regression harness for actual permissions, idempotency, quotas and timestamp behavior. It is isolated from production and uses temporary test tooling, not an app dependency. The harness does not prove multi-connection load behavior; the transaction lock is also reviewed in SQL.

Final local run: 219 tests across 21 files passed, and the production build completed with TypeScript checks and 43 locally generated pages. Ten isolated database checks passed, including the global cap and UTC boundary behavior. Browser checks exercised both qualification paths, local brief download, draft retention after a failed save, and layouts at 390px and 1280px. Local storage was intentionally unconfigured; successful persistence was tested in the action/store tests and isolated database, not claimed from the browser.

The implementation advances Integrate and local Verify. Distribute and production Sense remain open until release and a verified receipt. No scheduled loop, external outreach, paid service or billing automation was added. New code and this combined change log/release note are justified by the missing opt-in path; the regression coverage extends the existing test gate.
