# CourtListener source link repair (2026-11-16)

Claude Sonnet 5.5, 2026-11-16. Local change, not pushed or deployed.

Defect: the `courtlistener-mcp` entry in `lib/connections.ts` linked to `https://github.com/freelawproject/courtlistener-api-client/blob/main/MCP_README.md`, which answers 404. Free Law Project moved the MCP server to `https://github.com/freelawproject/courtlistener-mcp` (the client repo's `courtlistener/mcp.py` says so and points to the docs page below).

New source: `https://wiki.free.law/c/courtlistener/help/api/mcp/using-the-courtlistener-mcp-in-claude-chatgpt-and-other-ai-assistants` (FLP Wiki, "A project of Free Law Project"). It answered 200 with no redirect on 2026-11-16.

Also changed: `reviewed` 2026-10-27 to 2026-11-16, `sourceLabel`, `faqSources`, `faqsChecked`, the lead and the FAQs (they quoted the dead README). No other entry changed.

## Claims
- Kept, workflow: "Case law and opinions", "PACER data", "Citation network", "Oral arguments", "Judges and their financial disclosures", "Citation verification".
- Kept, account: "you will need a CourtListener account."
- Changed, requirements: old "supports Streamable HTTP and OAuth". The page never says Streamable HTTP. It says: "enter https://mcp.courtlistener.com/ as the server URL, choose OAuth if asked, and sign in with your CourtListener account."
- Changed, permissions: old "exposes alert management and broader API access". Backing: "Alerts — Real-time monitoring for new filings, citations, and queries"; sample prompt "sign me up for email alerts". "Broader API access" is dropped.
- Changed, setup: kept the URL and sign-in (sentence above). Dropped "does not need a separate API token" and "maintainer also documents token-based clients"; the page is silent on the first and does not document the second. Added: "The CourtListener MCP is available in Anthropic's MCP Connector Directory" and "Our MCP server is also available [in] OpenAI's Plugin Directory".
- Dropped from FAQs: "free for individuals", a usage-reporting tool, citation result fields (case name, court, date, good/bad/ambiguous), "client should ask you to confirm". The page says none of these.
- Changed in FAQs: Claude steps now "Go to Settings > Customize > Browse ... Find the CourtListener MCP in the connector directory". Claude Code: "claude mcp add --transport http courtlistener https://mcp.courtlistener.com/" and "opens a browser window for the OAuth flow". Cost: "All CourtListener users are granted API access, automatically. Elevated access is available through a Free Law Project membership or commercial agreement."
- Dropped "official" from the lead; the page says "Our MCP server" (Free Law Project's own). The entry `kind` stays "official" since Free Law Project runs it.

Not tested: the connector itself, sign-in, or `mcp.courtlistener.com` beyond one plain GET.

Seen, not touched: `lib/catalog-reviews.json` lines about 470 and 484 still cite the dead README; `lib/category-content.ts` line 226 and `lib/blog.ts` line 27 repeat "free for individuals".

## Second pass (same day): the dead URL elsewhere
Claude Sonnet 5.5, 2026-11-16.
- `lib/blog.ts`: source link repointed to the wiki page. The sentence "other clients may use documented API-token authentication" is replaced by the wiki's own wording: "All CourtListener users are granted API access, automatically. Elevated access is available through a Free Law Project membership or commercial agreement."
- `lib/category-content.ts` (line 226): "its accounts are free for individuals" replaced by the same access wording.
- `lib/catalog-reviews.json` (`courtlistener-mcp` source): url, sha256 and quote swapped. Old quote: "Search U.S. case law, dockets, judges, and oral arguments; extract and verify legal citations; and manage alerts". New quote, present on the wiki page: "direct access to case law, PACER data, judge information, and more". New sha256 `22521cbd...dca9df8` is the repo's normalized fingerprint of the page, equal on two fetches. The page prints a view count, so the weekly source check may flag drift; re-fingerprint then.
- Not changed, needs a gated database apply because `listing_sha256` binds them: the registry `claims` still say "maintainer also documents API-token authentication", "free individual accounts", and `mcp_repo_url` points to the Python client repo.
- Test added: the dead URL appears nowhere in `lib/` or `app/` outside comments.

## Rebase note (2026-11-17)
Claude Sonnet 5.5, 2026-11-17. Main's PR #32 (3cdbab8) fixed the same dead URL first, pointing at the `courtlistener-mcp` repo README, and re-read every claim against it. In the rebase I kept main's `lib/connections.ts`, `lib/blog.ts`, `lib/catalog-reviews.json` and `lib/category-content.ts` as they are (they hold claims main verified: "free for individuals", token wording). The wiki wording above is no longer applied. What this branch still adds: the two regression tests (source host and no `courtlistener-api-client` URL on the entry; dead README URL absent from `lib/` and `app/` code and data), pinned to main's new source.
