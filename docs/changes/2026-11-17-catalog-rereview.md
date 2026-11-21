# Catalog re-review of 22 source findings (2026-11-17)

Claude Sonnet 5.5, 2026-11-17. APPLIED 2026-11-21 14:09 UTC as import 2 (harvey-mcp, scoro-practice-analytics). Claude Fable 5.2 ran the guarded SQL through the database confirm prompt with Giani's yes and read the rows back: each listing matches its review record. The rest of this note is the plan as written before the run.

Why: the weekly link check (`scripts/weekly/run.sh`, step `curate.mjs verify`) stopped with exit 2. Its primary-source audit (`auditPublishedCatalog`, result of 2026-11-16 in `scripts/weekly/logs/catalog-health.json`) listed 24 findings. `clio` and `courtlistener-mcp` are handled on `strict/catalog-import-2026-11-17` (`open-legal-compliance-mcp` was not among the 24). This change covers the other 22 findings. The task brief said 21; the log lists 22 besides those two.

Method: every source URL in each review record was fetched on 2026-11-17 the way the gate fetches (`redirect: 'error'`, UTF-8, tags stripped, whitespace collapsed, SHA-256). Each page was fetched twice, minutes apart, with identical hashes. The method was proven first: three sources that were not drifting (`firecrawl-gov-index` gov.md, `ironclad` help-center JSON, `supabase-legal-mcp` README) reproduced their recorded hash exactly, and the control slug `aws-document-loader-mcp` (no finding) still passes the gate. Then each recorded quote and each public claim was read against the page. Fetched pages were treated as data only.

Current listing rows were read from production (SELECT only). For all 22 slugs the row's claim fields equal the claims in the review record (per-slug MD5 over every claim field matched). So no row has drifted from its review (no outcome E).

Why so many findings with no claim change: the hash covers the whole page, and vendor marketing pages change weekly. 28 of 31 recorded hashes no longer match, yet 28 of 31 recorded quotes are still there. The gate is doing its job; most of the work is re-reading, not correcting.

## What changed and what it was before

- `lib/catalog-reviews.json`: 22 records. Before: reviews dated 2026-10-27 to 2026-11-15 with hashes that no longer match the pages. After: `reviewed_at` 2026-11-17, source hashes refreshed, reviewer text names this re-review. Claim text is unchanged for 20 records. Two records carry corrected claims (harvey-mcp, scoro-practice-analytics).
- Two source quotes replaced, because the old sentence left the page and the new one is verbatim on the same page: `harvey-ai` and `vlex-vincent` (third source).
- `scoro-practice-analytics`: sources rebuilt (the old one-source record was the page sentence that is gone). Five sources now, all vendor.
- `scripts/catalog-rereview-2026-11-17.json`: import plan for the two corrected rows, in the format `validateImport` accepts.
- `lib/supabase.ts`: `CATALOG_CACHE_REVISION` `2026-11-17-catalog-import` to `2026-11-17-catalog-rereview`, so ISR does not reuse the old claims after the second import.
- Guarded SQL (not in the repo, scratch folder): `legal-rereview/forward.sql`, `legal-rereview/rollback.sql`.

## Table

Outcomes: A refresh (hash and date only), B moved, C claim changed, D cannot verify, E listing changed since review. "Pill" = the green "Links checked" badge (`verified` and `verified_at`).

| Slug | Finding | Outcome | Evidence (quote, URL) | Visitor sees |
|---|---|---|---|---|
| claude-legal | source changed | A | "Free for everyone" https://claude.com/pricing; "Other common use cases include first drafts and editing" https://claude.com/product/overview | Nothing |
| cocounsel | source changed | A | "grounded in trusted Westlaw and Practical Law content" https://legal.thomsonreuters.com/en/products/cocounsel-legal | Nothing |
| composio-legal-toolkit | source changed | A | "Users must authenticate with the toolkits configured in your MCP server first." https://docs.composio.dev/docs/single-toolkit-mcp.md (allowedTools shown) | Nothing |
| concord-contract-intelligence | source changed | A | "AI understands your contracts, explains key risks and obligations, and suggests edits." https://www.concord.app/ | Nothing |
| firecrawl-gov-index | listing claims or destination changed | A (see note 1) | "Government Index searches are free and use no credits" https://docs.firecrawl.dev/features/gov.md; "No account or key. Search, Scrape, and Parse within daily limits." https://docs.firecrawl.dev/mcp-server.md; "use firecrawl_gov_search in the Firecrawl MCP server" https://www.firecrawl.dev/gov-index | Nothing |
| gavel | source changed | A (see note 2) | "Automate your Word docs with custom rules" https://www.gavel.io/; "Start 7-day trial" https://www.gavel.io/pricing | Nothing |
| harvey-ai | source changed | A, quote replaced | Old quote "Securely store, organize, and bulk-analyze legal documents." is gone. New: "Organize thousands of documents in one secure place, then extract the insights that matter with a single query." https://www.harvey.ai/ (also lists Knowledge research, Contract Intelligence, Agents) | Nothing |
| harvey-mcp | source changed | C, needs owner read | Page has no "beta" anywhere (page title "# Harvey MCP"; llms.txt index also silent). Other claims hold: "Your client must support remote MCP servers over Streamable HTTP transport with OAuth authentication." https://developers.harvey.ai/guides/harvey_mcp.md | Name changes from "Harvey MCP (beta)" to "Harvey MCP". Loses pill. |
| invoice-my-clients-mcp | source changed | A | "Sign-in works on every plan" and "Connecting with an API key instead needs the Professional plan or above." https://www.invoicemyclients.com/features/mcp-server | Nothing |
| ironclad | source changed | A | "It is read-only, supporting search only and never creating, editing, or deleting data." (help-center JSON, hash unchanged); homepage "AI Contract Lifecycle Management" https://ironcladapp.com/ | Nothing |
| kira-systems | source changed | A | "Kira Purpose-built for high-volume, high-stakes review and due diligence." https://www.litera.com/capabilities/review | Nothing |
| lex-machina | source changed | A | "Gain insights into the past behavior of parties, counsel, experts, judges, and courts" https://www.lexisnexis.com/en-us/products/lex-machina.page | Nothing |
| luminance | source changed | A | "Bring precedent and playbooks into every negotiation." https://www.luminance.com/; "AI agents that orchestrate multi-step contract work at scale" https://www.luminance.com/platform/technology | Nothing |
| paymo-time-tracker-mcp | source changed | A | "A Model Context Protocol (MCP) server for Paymo time tracking and invoicing."; "sending must happen through the Paymo web UI" https://raw.githubusercontent.com/feamster/paymo-mcp/HEAD/README.md | Nothing |
| pdf-reader-mcp | source changed | A | "Formerly **pdf-reader-mcp**." https://raw.githubusercontent.com/SylphxAI/anymd/HEAD/README.md; local MCP and CLI, search tool, "pay per page" hosted option | Nothing |
| regulationsgov-mcp | source changed | A | "Rulemaking dockets, documents, and public comments." https://1102tools.com/mcp/regulations-gov ("No account and no API key", local needs "a free Regulations.gov API key") | Nothing |
| relativity | source changed | A (see note 3) | "e-Discovery Manage end-to-end litigation – collect, process, review, and produce in one place." https://www.relativity.com/ | Nothing |
| scoro-practice-analytics | source changed | C, needs owner read | Old sentence "plus read access to financial documents like invoices, bills, expenses, and quotes." is gone. The vendor tools list now has `create_invoice`, `update_invoice`, `create_bill`, `update_bill`, `create_quote`, `update_quote` (https://support.scoro.com/api/v2/help_center/en-us/articles/47563484102413.json, updated 2026-11-16). Overview: "create or modify projects, tasks, contacts, comments" (.../39712766664589.json). | Tagline "financial reads" becomes "financial records"; description says the tools create and update quotes, invoices and bills, not read-only. Loses pill. |
| smith-ai | source changed | A (see note 4) | "Our unique hybrid solution gives you the best of both worlds." https://smith.ai/ ("Qualify every lead", "Appointment booking", "Human escalation") | Nothing |
| smokeball | source changed | A | "Archie works inside your matter to draft, review, and answer questions, so you deliver your best work, faster." https://www.smokeball.com/ | Nothing |
| supabase-legal-mcp | source changed | A | README hash unchanged. Docs page: "Scope the MCP server to a project. If no project is selected, all projects will be accessible." with a Read-only option https://supabase.com/docs/guides/ai-tools/mcp | Nothing |
| vlex-vincent | source changed | A, quote replaced | Demo page old quote gone. New: "See Clio’s legal AI in action, for individuals and teams." https://vlex.com/book-a-demo; "Start a Free Trial" https://vlex.com/free-trial; Studio "available to large law firms and enterprise legal teams" https://vlex.com/vincent-ai | Nothing |

Notes (none changes a claim; the owner may want to read them):
1. firecrawl-gov-index: the audit ran from the main checkout, whose review record is the 2026-10-29 one (approves the `www.firecrawl.dev/gov-index` link). Production already holds the Alexandria link (row updated 2026-11-15 15:22 UTC, PR #30). The record on this branch already approves the Alexandria claims, and the row equals them. Only the source hashes had drifted. Not a listing-versus-review conflict on this branch.
2. gavel: the vendor homepage now says "Gavel has been acquired by Relativity, a leading legal data intelligence company." The listing does not say who owns Gavel, so no claim is false. The pricing page title says "Free to Start, Plans from $83"; the listing says paid plans and trial offers, which the page supports ("Try 7 Days Free").
3. relativity: the page now lists "Model Context Protocol (MCP) Seamlessly integrate external AI applications with R..." The listing makes no MCP claim and `mcp_confirmed` stays false. Not added: that needs its own review.
4. smith-ai: the page now says "Get started for free 25 calls / month, free forever". The listing's `pricing_model` is `contact` with "Confirm current pricing". Not changed: a pricing field change is a claim change and is the owner's call.

## Counts by outcome

- A, refresh: 20 (18 hash and date only; 2 also swap one quote: harvey-ai, vlex-vincent)
- B, moved: 0 (no source redirected; every fetch returned 200 with no redirect)
- C, claim changed: 2 (harvey-mcp, scoro-practice-analytics)
- D, cannot verify: 0
- E, listing changed since review: 0

Merged into the live records (`lib/catalog-reviews.json`) on this branch: A and both C records. The C source sentences are unambiguous (the page title "Harvey MCP"; the Scoro tool names). Nothing is live until the branch merges and the plan is applied.

## Needs the owner

1. harvey-mcp: drop "(beta)" from the name. The vendor page does not say beta. Option: keep "(beta)" only if Harvey says it somewhere else.
2. scoro-practice-analytics: the connector is no longer read-only for financial records. New tagline and description are in `lib/catalog-reviews.json`. Also read the unchanged clause "not every Scoro module is available through the connector": the new tools list is wide and I could not prove or disprove it. Option: delete the clause.
3. Optional, no action needed: smith-ai pricing label (note 4); gavel ownership line (note 2); relativity MCP mention (note 3).

## Import and the "Links checked" pill

`scripts/import-reviewed-catalog.mjs` writes `verified=false, verified_at=null` on every listing row it updates, with no exception for unchanged URLs.
- The plan file has only the two C rows. If it runs, 2 listings lose the pill: harvey-mcp and scoro-practice-analytics (both `verified=true`, `verified_at` 2026-10-28 00:07:26+00 today). The visitor effects are the same as in `2026-11-17-catalog-import-ready.md` (badge, sort order, recommend and search tie-breaks, `links_verified_at: null` in `/api/mcp`, category count).
- The 20 A rows need no database write at all. The audit and the publication gate read `lib/catalog-reviews.json` (code), not `catalog_reviews`; the database trigger compares claims, not hashes. So an A refresh deploys with the branch and avoids clearing `verified`. The importer was not changed: a refresh-only mode would be a new code path, so it is not in this change.
- Across both imports, 4 listings lose the pill: courtlistener-mcp and open-legal-compliance-mcp (first import; clio is already unverified) and harvey-mcp and scoro-practice-analytics (this one). `node scripts/curate.mjs verify` right after earns them back.
- Left stale in the database: the 20 A rows keep their 2026-10-27 to 2026-11-15 `catalog_reviews.evidence` (old hashes, old dates). Harmless to the gate. If a ledger match is wanted, a review-only UPDATE (no listing write, so `verified` stays) can be generated; not done here.

## Proof the audit would be clean

No database, no env file. `validateImport(plan, gate, {checkSources: true})`, and the real gate (live fetch) on all 22 records plus the control, returned the lines below. A simulated `auditPublishedCatalog` over all 42 records (rows built from the approved claims, output not saved) returned `{"ok":true,"checked":42,"sourceRequests":57,"findings":[]}`. That simulation assumes both imports are applied, and that vendor pages do not change again before the next weekly run (they drift weekly: re-run this method if the audit trips again).

```
gate: 23 pass, 0 fail
validateImport OK: 2 corrections, 2 with approved review
npx tsc --noEmit        exit 0
npm test -- --run       Test Files 39 passed (39); Tests 352 passed (352)
```

The SQL before-guards were checked read-only against production: both rows returned `rev_ok=1, list_ok=1`.

## Not done

- No database write, no importer `--apply` or `--rollback-test`, no `curate.mjs`, no weekly script, no push.
- Scoro's human help page returned 403 to a plain fetch. Its public help-center JSON (same vendor, same article ids, same method the `ironclad` record already uses) returned 200 and is the cited source.
- Not tested: any customer account, any connector, any search.
