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
