# Dead cited sources: CourtListener MCP docs and a Clio help article (2026-11-16)

Claude Sonnet 5.5, 2026-11-16. Two cited sources returned 404. Each was re-read at its new home and each claim was checked against the new text. No listing claim text changed, so no listing hash changed and no database write is needed.

Hash method: `lib/catalog-review.ts`. Fetch the URL with no redirects, strip script and style blocks and tags, collapse white space, then sha256. Every new hash below was computed that way and re-fetched once to confirm it is stable. The quote was found in the normalized text.

## 1. CourtListener MCP documentation

Before: `https://github.com/freelawproject/courtlistener-api-client/blob/main/MCP_README.md` and its raw twin (hash `ce8ed226...`).

Why dead: Free Law Project moved the MCP server to its own repo. Commit 810b81a in courtlistener-api-client, "feat!: remove the MCP server (#414)", 2026-11-13, says the server "now lives in freelawproject/courtlistener-mcp". The API client README now points there and to the wiki.

After: `https://github.com/freelawproject/courtlistener-mcp/blob/main/MCP_README.md` (raw twin for the hashed source). Hash `0de287dc...`. Same file name, same hosted URL, https://mcp.courtlistener.com/.

Changed in code:
- `lib/connections.ts`: `source`, FAQ source URL, the comment that names the fetched source, `reviewed` and `faqsChecked` (both 2026-11-16).
- `lib/blog.ts`: the "official setup and tool documentation" link.
- `lib/catalog-reviews.json` (`courtlistener-mcp`): source URL and hash. Quote is unchanged and still present word for word: "Search U.S. case law, dockets, judges, and oral arguments; extract and verify legal citations; and manage alerts".

Claims checked against the new README, all still hold: free accounts for individuals; no separate API token for the hosted server; Claude.ai and Desktop steps (Settings, Connectors, Add custom connector, name CourtListener, URL); the `claude mcp add --transport http` command; `analyze_citations` returns case name, court, date and good, bad or ambiguous; `get_api_usage` reports usage and rate limits; alert tools change account state; API tokens are documented for clients that cannot run OAuth.

One claim changed: the "Can it change my account?" FAQ now also names the Pray and Pay tools. The README says those "also modify your CourtListener account state".

Not changed, flagged: the catalog listing (`courtlistener-mcp`) still says "document purchases and other charges" and "possible charges". The new README says Pray and Pay costs the user nothing. The wording is hedged ("confirm current terms"), but the source no longer backs it, and `mcp_repo_url` still points at the API client repo. Fixing those changes the listing hash and needs a reviewed import into the database, so that is left for a separate step. The review date for that entry was not advanced for this reason.

## 2. Clio help article 29765932267675

Before: `https://help.clio.com/api/v2/help_center/en-us/articles/29765932267675.json`, quote "Suggested time entries from unlogged communication, notes, or completed tasks."

Why dead: the article is deleted. The help center API gives 404 and the public page shows "This page is no longer available" in a real browser. (Plain curl gets 403 from the whole site; that is bot blocking. The `/api/v2/help_center` JSON path is not blocked, so it keeps working with the repo's fetcher.)

After: three live Clio help articles, fetched as help center API JSON like the old source:
- Time Entries (9289741706779): "help you proactively identify matter activity and suggest unlogged time entries". Supports suggested time entries from unlogged activity.
- Draft Client Communications (29658448391067): "recognizes when a client update is warranted". Supports AI-drafted client communications.
- Automate Invoicing (29764998990491): "Clio's AI converts recorded entries into invoices". Supports AI-generated draft invoices.

The other recorded source, `docs.developers.clio.com/guides/clio-manage/`, had a stale hash. The page still has its quote ("A matter is the central organizing record for legal work in Clio Manage.") and the Custom Actions text for "cross-application workflows". Hash updated to `03a5d0bc...`.

The `clio` review date stays 2026-10-27. The description still says "recommendations for ... bills", which is not the vendor's wording ("draft invoices"), so not every printed claim was re-read and holds. The new wording and the date move together in the prepared import, `docs/changes/2026-11-16-catalog-import-prep.md`. Nothing in the repo ties `reviewed_at` to the source hashes; it is only the 90 day age check and a string the build prints on each page.

## Other dead links in the catalog

`npm run curate:links` needs the Supabase service environment, which this worktree does not have, so it did not run. Instead every recorded source and every `external_url`, `mcp_repo_url`, `creator_url` and `logo_url` in `lib/catalog-reviews.json` was probed. Two problems besides the above:
- `open-legal-compliance-mcp` `creator_url` https://github.com/TCoder920x returns 404. Claim field, needs a reviewed import.
- `clio` `creator_url` https://www.clio.com returns 403: bot blocking, not dead.

Source hashes on many other entries have drifted because live pages change. Those are the weekly sensor's job and were not touched.

## 3. Canonical on /pilot, and Open Graph that follows the canonical

Claude Sonnet 5.5, 2026-11-16, at the director's request.

Search Console: "Duplicate without user-selected canonical" for `/pilot` and `/pilot?source=mcp` (first seen 2026-11-09).

Live check today: `https://legalaimcp.com/pilot?source=mcp` already serves `<link rel="canonical" href="https://legalaimcp.com/pilot"/>`, a fixed string that does not change with the query. `app/pilot/page.tsx` has had it since the page was added, and `/pilot` is in `app/sitemap.ts` (kept). So the Search Console row is stale or lagging; the page needs no canonical change. Ask Search Console to validate the fix after merge.

What the live page did get wrong: `og:url` was `https://legalaimcp.com` (the home page) on `/pilot`, because a page that sets no `openGraph` inherits the layout's block, and a page that sets its own loses the layout's `og:url` and `og:image`. Scan of the 80 built indexable pages before the fix: 74 had `og:url` different from the canonical (null or home), 55 had no `og:image`, 2 had no `og:type`.

Fix: `withSocial()` in `lib/seo-meta.ts` sets `og:url` to the page's own canonical and adds the shared card image (`/opengraph-image`, 1200 by 630) and `og:type`/site name when missing. Every static page and the four `generateMetadata` templates (`/best/[slug]`, `/blog/[slug]`, `/categories/[slug]`, `/servers/[slug]`) now pass through it. Pages without a canonical (the not-found fallbacks) are untouched.

Route scan for "reachable with query params and no fixed canonical": every page under `app/` sets a fixed canonical string except `/admin/login`, which is a client component with no metadata and was indexable. It now has a `layout.tsx` with `noindex`. Pages that read `searchParams` (`/pilot`, `/servers`, `/featured/success`, `/featured/cancel`, `/admin/pilots`) all have fixed canonicals or `noindex`.

## 4. Titles and descriptions (Ahrefs 2026-11-12)

The 15 long titles were already fixed on main by #27 (`fitTitle`, 2026-11-12, after that crawl), and the `/about` description by #29. Checked live today and in the local build. Rendered title lengths, before (Ahrefs) and after (built page, suffix included):

| URL | Before | After | Rendered title |
| --- | --- | --- | --- |
| /servers/courtlistener-citations-checker | 86 | 49 | CourtListener Citation Validation MCP (community) |
| /servers/courtlistener-mcp | 73 | 49 | CourtListener MCP (Free Law Project) \| LegalAIMCP |
| /servers/courtlistener-mcp-self-hosted | 74 | 50 | CourtListener MCP (blakeox community) \| LegalAIMCP |
| /best/billing-time-mcp-servers | 73 | 51 | Best AI Time Tracking & Billing Tools for Law Firms |
| /servers/clio-matter-manager | 72 | 48 | Clio MCP Server (CHLEGAL community) \| LegalAIMCP |
| /best/case-management-mcp-servers | 74 | 52 | Best AI Case & Matter Management Tools for Law Firms |
| /servers/freshbooks-legal-billing | 79 | 55 | FreshBooks MCP Server (roboulos community) \| LegalAIMCP |
| /best/client-communication-mcp-servers | 79 | 57 | Best AI Client Intake & Communication Tools for Law Firms |
| /servers/diligent-compliance | 77 | 53 | Diligent Governance, Risk and Compliance \| LegalAIMCP |
| /servers/firecrawl-gov-index | 71 | 47 | Firecrawl Government & Legal Index \| LegalAIMCP |
| /servers/canlii-legal-research | 82 | 58 | CanLII MCP (Vaquill community implementation) \| LegalAIMCP |
| /servers/billing-ai-checkbox | 71 | 47 | Checkbox First Pass Invoice Review \| LegalAIMCP |
| /blog/courtlistener-mcp-inside-claude | 73 | 60 | CourtListener in Claude: Sources, Access and Research Limits |
| /blog/compliance-considerations-ai-law-firms | 74 | 54 | AI Software Due Diligence for Law Firms: Questions to… |
| /blog/general-legal-mcp-server-first-law-firm | 75 | 54 | General Legal’s MCP Service: Check the Engagement and… |

The title template is unchanged; `fitTitle` drops the suffix when it would pass 60 and cuts at a word boundary only if the title alone is too long.

Changed in this PR:
- `/about` description 155 to 146 characters (dropped "curated"; no new words). Limit moved to 150 for that page.
- `/pilot` description 166 to 150 (dropped "before sending a request").
- Three category descriptions (case-management, legal-research, compliance) were 158 to 159; cut a few words each, now 147 to 153.
- `DESC_MAX` is 155 (was 160).
- New test `lib/seo-sitemap-meta.test.ts` renders title and description for every static sitemap route and the `/best`, `/blog` templates, plus the title and tagline builders for every reviewed listing. It fails over 60 title characters, over 155 or under 110 description characters, a canonical other than the page's own, or an `og:url` that is not that canonical. `vitest.config.ts` gets a JSX setting so the test can import page modules.

Scan of all 80 indexable built pages after the changes (title, description 110 to 155, canonical, og:url equal to canonical, og:title, og:description, og:image, og:type): zero issues.

Ahrefs counts-only rows not fixed here, because their URLs were not listed and the local scan shows no matching page: "Meta description tag missing" 3 (likely non-indexable pages), "Page has links to redirect" 3, "Product page missing Product schema" 22, "Article page missing Article schema" 17, "Structured data validation error" 43. These need the Ahrefs URL lists.
