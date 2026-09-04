# LegalAIMCP

A directory site for AI integrations built for law firms — MCP servers, legal research
tools, and AI-assisted workflow products. Browse listings by category, read the blog, or
submit a tool for inclusion.

**Live:** [legalaimcp.com](https://legalaimcp.com)

## What it does

- **Listings directory** — browsable, categorized catalog of legal-AI tools and MCP servers
- **Blog** — content on AI adoption in legal workflows
- **Submission flow** — public form for tool creators to submit a listing for review
- **Admin panel** — RLS-gated review/approval workflow for submissions

## Stack

- Next.js 15.5 (App Router) + React 19
- TypeScript, Tailwind CSS 3
- Supabase (Postgres) for listings, categories, and blog content
- Zod v4 for validation
- Vercel Analytics

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm test         # vitest run
```

Requires Supabase project env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — see `.env.example`.

## Featured placements

Optional paid **Featured** bump: **$79 for 30 days** (peer directories often charge ~$99). It only boosts browse sort + a Featured badge; **MCP search stays free**. Listings themselves never require payment to appear.

- Checkout: `POST /api/stripe/checkout` with `{ listing_id }` or `{ slug }`
- Webhook: `POST /api/stripe/webhook` (`checkout.session.completed`)
- Expire cron: `GET /api/cron/expire-featured` with `Authorization: Bearer $CRON_SECRET`
- Pricing page: `/pricing`

Scaffold only until you create a Stripe Price ($79 one-time), wire the webhook, and set Vercel env (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_FEATURED_30D`, `CRON_SECRET`). Never commit live Stripe secrets.

## Cursor Agent Plugin

Agent Plugins 1.0.0 packaging for the public MCP at `https://legalaimcp.com/api/mcp` (streamable-http, no auth).

- `plugin.json` — manifest
- `mcp.json` — remote server
- `skills/legalaimcp/SKILL.md` — when to search vs recommend vs get

Local Cursor IDE: copy those files to `~/.cursor/plugins/local/legalaimcp` and reload. Grok Bot does not load that folder; it only sees Cursor dashboard/marketplace installs.

Submit the public repo URL at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish).

