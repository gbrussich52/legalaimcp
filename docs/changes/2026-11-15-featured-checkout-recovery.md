# Featured checkout recovery (2026-11-15)

Claude Fable 5.2 (executor), 2026-11-15.

## Why
In seven weeks three people (gavel, clio-matter-manager, clientintake-ai) opened the $69 "Featured 30 days" checkout and left Stripe without typing an email. Nothing was recorded before the redirect, so there was no contact and no reason.

## What the prior code did
`POST /api/stripe/checkout` took a slug or listing id and created a Stripe session at once. The cancel page said "No charge was made" and stored nothing. The webhook handled only paid events.

## What changed
- **Intent step.** "Feature this listing" opens an inline form (work email, role: works here / agency or consultant / just looking). The server stores a `featured_intents` row, then creates the session. "Just looking" continues. If the intent insert fails it is logged and the buyer still reaches Stripe (a lost lead costs less than a lost sale).
- **Stripe session.** Adds `customer_email`, `client_reference_id` (intent id), `after_expiration.recovery.enabled`, `metadata.intent_id`; cancel URL carries `&intent=<id>`. Success URL, fixed origin and existing metadata unchanged.
- **Webhook.** `completed` / `async_payment_succeeded` mark the intent paid (once; replays are no-ops). `checkout.session.expired` marks it expired and stores `after_expiration.recovery.url`. Bookkeeping runs after fulfillment and never changes the response. Signature check and paid behavior unchanged.
- **Cancel page.** "What stopped you?" with four buttons. One click writes `cancel_reason` (`POST /api/featured/cancel-reason`, rate limited, never touches a paid row). Then: "Send me the payment link to forward" (the still-open Stripe session URL) and "I have a question" (mailto hello@legalaimcp.com, listing name in subject). No discounts.
- **Funnel.** Steps go to our own `funnel_events` table through `recordFunnelEvent` (`lib/funnel.ts`): `featured_click` (client, `POST /api/featured/click`, `{slug}` only), `featured_intent_submitted`, `featured_stripe_redirect`, `featured_cancel_reason`, `featured_paid`, `featured_expired`. Only slug plus enum props (`role`, `reason`); values outside the enums or containing `@` are dropped. It never throws and never blocks the buyer.
- **Abuse limits.** New `lib/rate-limit.ts` (in-memory, per instance, like the admin-login lockout; no shared limiter existed): checkout 5 per 10 min, click 30, cancel-reason 10. Honeypot field `website`. Email checked by format and a small disposable-domain list, no lookups.
- **Migration** `supabase/migrations/008_featured_intents_funnel.sql`: `legalaimcp.featured_intents` and `legalaimcp.funnel_events`, RLS on, no anon/authenticated policies, grants to `service_role` only. `featured_intents` holds email (PII); `funnel_events` holds none.

## Roll back
Revert the merge commit. Then the form, cancel survey and new endpoints go away and checkout returns to slug-only. The tables are additive and can stay (or `DROP TABLE legalaimcp.featured_intents, legalaimcp.funnel_events`). Stripe sessions already created keep working; the webhook ignores unknown intent ids.

## Manual steps still needed
1. Apply migration 008 to the `legalaimcp` schema (Supabase project `bzrdzchrdthyrhdsodla`). Do this BEFORE merging, or checkout logs intent-insert errors until it exists (checkout still works).
2. In the Stripe Dashboard, confirm the webhook endpoint is subscribed to `checkout.session.expired` (it must already have `checkout.session.completed` and `checkout.session.async_payment_succeeded`).
3. Stripe recovery emails need "Promotional emails" consent collection if you want Stripe to email the recovery link itself; we only store the URL for our own follow-up.

## Orchestrator review (Claude Fable 5.2, 2026-11-15)
- `app/privacy/page.tsx`: added the Featured form to the list of what we collect (prior text listed only /submit and /pilot).
- `app/pricing/page.tsx`: step 2 now says the click asks for a work email and role before Stripe (prior text said it opened Stripe Checkout).
- Comments no longer say the Vercel plan drops custom events: the team is on Pro. The first-party table stays because the funnel sits next to buyer email.
- The migration is history-only in this repo; the applied copy lives in property-appraisal-pro `supabase/migrations/`.
