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
