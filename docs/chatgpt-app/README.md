# LegalAIMCP ChatGPT app

This release extends the existing `/api/mcp` endpoint with a fifth, free `build_legal_ai_shortlist` tool and one inline MCP Apps resource. It preserves the existing search/detail/category/recommendation contracts. The standalone `/chatgpt` web preview uses the same generated interface and retrieval service; its supporting privacy and support pages exclude unrelated site sales flows.

## Design and boundaries

The tool takes fixed workflow and firm-size choices, a free-only toggle, and a cap of five. It reads at most 200 published catalog rows using the existing public Supabase client and its five-minute cache; an eight-second query deadline and overflow error prevent unbounded or incomplete retrieval. It never fetches caller/catalog URLs. Strict schemas reject arbitrary text, files, URLs and extra keys. Ranking uses the matching category, catalog firm-size tags, pricing tier and slug. Contract picks also require contract-related catalog text and prioritize matching name/tagline evidence over description-only mentions. Paid placement and link checks do not change this shortlist’s rank.

The output distinguishes catalog retrieval time, documentation review date and last passing URL check. Reviewed setup information is documentation evidence only; all results explicitly state that customer-account and ChatGPT compatibility are untested. Unknown evidence stays unknown. Empty matches are a valid result; a failed catalog lookup returns an error with no fixture fallback. The utility does not save requests in an application table or maintain user profiles. Infrastructure logs may retain request metadata; the web preview’s choices appear in the URL.

Official `@modelcontextprotocol/ext-apps` 1.3.2 supplies the browser bridge and app registration helpers. This release is selected for compatibility with `mcp-handler` 1.1.0’s exact MCP SDK 1.26.0 peer pin. The newer bridge 2.x requires the separate MCP server 2.x package and is not dropped into a 1.x transport. No protocol is hand-rolled. Exact-origin checks, a 32 KiB actual-byte body cap and a five-second body deadline, single-message JSON-RPC envelopes, 12-level nesting and 256-member structural limits wrap the maintained handler. Bundled third-party license notices accompany the widget. Third-party content enters DOM text nodes only; source links require public HTTPS and are never auto-opened. No service-role key is used.

## Build and checks

```
npm ci
npm run chatgpt:build
npx tsc --noEmit
npm test
npm run build
npm run chatgpt:package
```

Set only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for public catalog retrieval. No additional API key is required. Existing catalog artifact checks intentionally fail a disconnected build that lacks expected live-catalog pages. Do not weaken that gate. `npm run dev -- --port 3102` serves the preview. The generated HTML module is committed and rebuilt before dev/production builds. The plugin ZIP is generated in ignored `dist/`; it contains `plugin.json` (including five positive and three negative review cases), `mcp.json` and the icon. It points to the existing remote endpoint; it is not a deploy bundle. No fabricated registered app ID is included. Public submission uses the remote endpoint under “With MCP.”

## Hunt and first-principles decision — October 20, 2026

Purpose: make the existing legal software catalog usable as a small, sourced comparison inside ChatGPT. Without it, existing MCP search remains available but has no workflow comparison UI. A second MCP server or new catalog would duplicate the current maintained endpoint/database; the release merges into those existing services.

Queries: GitHub `openai apps sdk examples`; official OpenAI MCP server, UI, reference and plugin-packaging docs. Best hit: [openai/openai-apps-sdk-examples](https://github.com/openai/openai-apps-sdk-examples) (MIT; official repository observed updated October 20, 2026). Adapt its registered resource/tool pattern and use the official bridge. [MCP UI docs](https://developers.openai.com/plugins/build/chatgpt-ui), [reference](https://developers.openai.com/plugins/reference) and [packaging](https://developers.openai.com/plugins/build/plugins) prefer standard `ui.resourceUri`, MCP Apps MIME and portable `plugin.json`/`mcp.json`. Existing OpenAI compatibility aliases remain alongside the standard fields.

Verdict: improve the current endpoint. Evidence against keeping this would be unsupported transport, persistent retrieval failures, misleading compatibility claims or no useful shortlist beyond ordinary catalog search. The existing deterministic scorer and public catalog are simpler than paid model ranking or a parallel server. The observed weekly source collector is incomplete (October 20: Ironclad source unreadable and Registry queries failed); therefore this release makes no new live source-verification claim. The income sensor was green separately. Source-maintenance repair remains with the existing workflow rather than silently refreshing dates here.

Net growth is justified by one app surface plus two deterministic build/package scripts needed to reproduce and review it. These scripts replace manual widget assembly and ad hoc ZIP creation; neither installs a schedule, daemon or new inference service. This directory consolidates design, listing, review and verification evidence for the app; it does not duplicate estate planning.

Create and Verify are the stages advanced here. Distribute and ChatGPT-host Sense remain open until independently reviewed deployment and real host testing. Goal mode was not activated. Manager acceptance is tracked outside this public package; dashboard checkmarks are implementation evidence only.
