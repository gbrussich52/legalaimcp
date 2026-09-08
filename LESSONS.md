---
classification: PUBLIC
---
# LESSONS — legalaimcp

- 2026-09-04 — A test named "returns false for forged cookie values" passed against a fixed-string cookie because it only tried strings that were not the fixed string. A test that cannot fail for the thing it is named after is false assurance; when you write an auth test, include the value an attacker would actually guess (here, the literal the server accepted). Fixed by signing the session (PR #8). — Fable 5.1
- 2026-09-04 — "Safe: content is server-side" comments above `dangerouslySetInnerHTML` were wrong the day user submissions started flowing into the same fields. Never annotate a sink as safe; escape at the sink (`lib/json-ld.ts`) so the claim does not depend on every upstream path. — Fable 5.1
- 2026-09-04 — `checkout.session.completed` is not "paid". Delayed-payment methods complete the session before the money settles; grant only on `payment_status === 'paid'` and also handle `async_payment_succeeded`. — Fable 5.1

- 2026-09-05 — Normalized listing-category enums into URL slugs for homepage counts and allowed listing grid cards to shrink at mobile widths. Added category coverage/count-conservation regression tests. Lesson: validate customer-visible claims and meaningful rendered state, not only HTTP success. Evidence: website sweep and local repair checks. — Codex
- 2026-09-07 — Security batch: added Zod validation to the admin login route (rate limiter and constant-time password compare were already correct), narrowed 5 `select('*')` queries to named columns (new `ListingDetailData`/`LISTING_ADMIN_COLUMNS`/`CATEGORY_COLUMNS`/`SUBMISSION_COLUMNS` in `lib/types.ts`), added HSTS + a narrow CSP to `next.config.js`, and pinned `postcss` to 8.5.23 via a scoped `overrides.next.postcss` to clear a high-severity advisory without bumping Next major. Gate item 15 (`dangerouslySetInnerHTML`) still flags `app/components/JsonLd.tsx` and `app/blog/[slug]/page.tsx` as false positives: JsonLd already escapes via `lib/json-ld.ts`'s `toJsonLd()`, and the blog page renders only hardcoded content from `lib/blog.ts` with no user-input path — the gate's check is a mechanical grep with no awareness of an escaping helper or a static-only data source. Lesson: a `dangerouslySetInnerHTML` grep gate needs an allowlist for known-safe sinks, or it will cry wolf forever. Also: when a Supabase `.select()` column list is built with string concatenation (`+` across lines) instead of one literal, `@supabase/supabase-js`'s compile-time select-parser can't infer the return type and throws `GenericStringError` — keep column-list constants as single-line literals. — Fable 5.1

## 2026-09-08 — Product claims need delivery evidence

A subscriber insert was described as email delivery; MCP was described as keeping data private by design; Sponsored and editorial Featured were rendered alike. Corrected the buyer journey and added `lib/conversion-integrity.test.ts` to prevent those claims returning. Link verification proves URL resolution, not integration compatibility. New workflow briefs explicitly distinguish a planning template from a tested implementation.

A successful build without network access silently generated fewer pages because database queries returned empty results. Verified the network-enabled artifact includes 96 pages, not just a successful exit code. Analytics imports also do not establish collection: verify project activation and plan support before claiming a working funnel. No new scheduled loop; regression coverage is part of the existing test gate.

## 2026-09-08 — An editable workflow must invalidate its previous result

Moving from a fixed-ID prototype to editable document metadata adds state transitions that pure domain tests cannot see. Every edit, addition, deletion, example replacement, and clear action must invalidate the displayed result. Browser checks cover those transitions; the document-check domain and integrity tests cover the underlying semantics and data-flow boundary.

An explicit document association is stronger evidence than filename similarity. Do not flag a different filename as incorrect when the user deliberately linked it to the request. Omitted optional metadata is not checked, and duplicates or missing expected values require review. Tests in lib/document-check.test.ts preserve these distinctions; lib/document-check-integrity.test.ts gates unintended uploads, persistence, or input telemetry.
