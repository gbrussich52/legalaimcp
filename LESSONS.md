---
classification: PUBLIC
---
# LESSONS — legalaimcp

- 2026-09-04 — A test named "returns false for forged cookie values" passed against a fixed-string cookie because it only tried strings that were not the fixed string. A test that cannot fail for the thing it is named after is false assurance; when you write an auth test, include the value an attacker would actually guess (here, the literal the server accepted). Fixed by signing the session (PR #8). — Fable 5.1
- 2026-09-04 — "Safe: content is server-side" comments above `dangerouslySetInnerHTML` were wrong the day user submissions started flowing into the same fields. Never annotate a sink as safe; escape at the sink (`lib/json-ld.ts`) so the claim does not depend on every upstream path. — Fable 5.1
- 2026-09-04 — `checkout.session.completed` is not "paid". Delayed-payment methods complete the session before the money settles; grant only on `payment_status === 'paid'` and also handle `async_payment_succeeded`. — Fable 5.1
