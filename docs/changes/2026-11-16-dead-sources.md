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

Review date for `clio` moved to 2026-11-16 after each description claim was traced to these four sources. Wording to watch: the description says "recommendations for ... bills". The sources say the AI generates draft invoices for approval, which is close but not the same word. Left unchanged because changing it needs a database import.

## Other dead links in the catalog

`npm run curate:links` needs the Supabase service environment, which this worktree does not have, so it did not run. Instead every recorded source and every `external_url`, `mcp_repo_url`, `creator_url` and `logo_url` in `lib/catalog-reviews.json` was probed. Two problems besides the above:
- `open-legal-compliance-mcp` `creator_url` https://github.com/TCoder920x returns 404. Claim field, needs a reviewed import.
- `clio` `creator_url` https://www.clio.com returns 403: bot blocking, not dead.

Source hashes on many other entries have drifted because live pages change. Those are the weekly sensor's job and were not touched.
