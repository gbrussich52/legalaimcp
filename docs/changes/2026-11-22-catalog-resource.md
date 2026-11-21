# Three audit findings: diligent-compliance, ironclad, pdf-reader-mcp (import 4, 2026-11-21)

Claude Sonnet 5.5, 2026-11-21, checked by Claude Fable 5.2. PREPARED, NOT APPLIED. No database was touched. The SQL below has not been parsed by a database.

Stacked on `strict/catalog-import-2026-11-21` (`69b67c2`). Goal: the Monday 2026-11-23 audit finds 0 problems in 42 listings.

Every vendor page was read again on 2026-11-21 with the repo's own `sourceFingerprint`, fetched the way the audit fetches (Node fetch, no redirects followed). Saved copies sit in the Claude scratchpad folder `resource-1122/`.

## Verdicts

| Slug | Verdict | Database change |
| --- | --- | --- |
| diligent-compliance | Source only. Every claim still holds. | None |
| ironclad | Source only. Every claim still holds. | None |
| pdf-reader-mcp | Claim change (pricing). | forward-4.sql, PREPARED, NOT APPLIED |

## diligent-compliance (source only)

- Prior quote "Centralize governance, risk and compliance in one AI platform." is gone. The home page now reads "The leading AI platform for GRC".
- New quote on https://www.diligent.com/: "Agents work across governance, risk and compliance." New hash `e3832557cb349d6824f1747e7ddf5f86aaeebaaf1d2ab3eb2f0cfd37d033eebf`.
- Claims checked against the page: governance, risk and compliance products; Policy Manager ("review, create, deploy, and administer corporate policies"); Due Diligence; Third Party Manager ("third-party monitoring and compliance processes"); "Automated third-party screening and risk triage powered by agentic AI"; "Request pricing" buttons support the contact model. No claim changes.
- Record fields moved: `sources` only. `reviewed_at` stays 2026-10-27, so this record turns 90 days old on 2027-01-25.

## ironclad (source only)

- Source 2 moved. The Zendesk API address for article 39887632957463 now returns 404. The help center moved to `support.ironcladapp.com/en-us/articles/...` (the old `/hc/` article links answer 301). The same article, "Connect an MCP Client to Ironclad MCP Server", is now https://support.ironcladapp.com/en-us/articles/18170697-connect-an-mcp-client-to-ironclad-mcp-server (hash `fcbd5d69b4264ec2281aeb172c26cdb812def725d4c471d2f9dfed2e54908576`). The stored quote is unchanged and present: "It is read-only, supporting search only and never creating, editing, or deleting data."
- Source 1 (https://ironcladapp.com/) drifted. Same quote, "AI Contract Lifecycle Management", still present. New hash `32daa50a7556b209d2150c1733cab0818d878824473602e3d0edee086f921e60`.
- Claims checked: read-only conversational search; obligation tools need the Obligations add-on; "Features API, Search" eligibility; session scopes and client support text; user and group permissions. All still on the pages. No claim changes.
- Record fields moved: `sources` only.

## pdf-reader-mcp (claim change)

Source: https://raw.githubusercontent.com/SylphxAI/anymd/HEAD/README.md (hash `12c33ac9805ecda1bad74a5265f2d600152620cca8f70df5bc9b9f70b23a3c10`).

| Field | Before | After | Supporting line |
| --- | --- | --- | --- |
| pricing_model | free | freemium | "The core stays free and MIT licensed, and nothing that was free has moved to Pro." and "US$29, one payment. No subscription, no account." |
| pricing_details | MIT-licensed local server/CLI. Maintainer also offers a separately hosted, metered parsing service; confirm any hosted or optional-model costs. | MIT-licensed local server and CLI, free to use with no API key. The maintainer also sells an optional anymd Pro licence for US$29, one payment, which adds PDF cite_check and video timelines. Confirm current price and terms on the maintainer's pricing page. | README: "A fast Rust MCP server and CLI that runs on your machine. No API key."; "Pro adds two tools ... PDF `cite_check`" and video timelines |
| description | ... Documentation reviewed on October 27, 2026; ... | ... Documentation reviewed on November 21, 2026; ... | Date of this re-read. No other word changes. |

Why: the README no longer mentions a hosted or metered service. `freemium` is a value the database enum already allows (`free`, `freemium`, `paid`, `contact`) and the catalog uses it for a free core plus a paid option (for example german-law-mcp).

Review record: `listing_sha256` is now `69e6c8b19968805179c479a261533dff8503c91f8a3f7d4312ad75abcd8c75b9` (computed with `catalogFingerprint`), reviewer "Claude Sonnet 5.5 primary-source re-read on November 21, 2026, checked by Claude Fable 5.2", reviewed_at 2026-11-21. Three sources on the same README: the rename line, the free MIT core line, the US$29 line.

Open point for the director: the description says the project is "not a legal-analysis or citation-verification system". Pro adds `cite_check`, which checks that a quote appears on a cited PDF page. That is quote location, not legal citation checking, so the sentence was left alone.

## Not changed

smith-ai. The vendor home page (https://smith.ai/) now says "Get started for free 25 calls / month, free forever" while the listing says `contact`. Reported only.

## How it is applied

1. SQL: `forward-4.sql` (rollback `rollback-4.sql`, read-only pre-check `guard-4.sql`) in `docs/ops/legalaimcp-import-2026-11-17/`. PREPARED, NOT APPLIED. Importer equivalent: `node --env-file=.env.local scripts/import-reviewed-catalog.mjs scripts/catalog-resource-2026-11-22.json` from this branch. Plan file: `scripts/catalog-resource-2026-11-22.json`.
2. diligent-compliance and ironclad need no database write. Their ledger rows keep the older evidence, as the 12 source-only records of import 3 did.
3. Read the target back, then run `npm run build` and `npm run catalog:verify`. Build waits on the SQL because its post-build check reads live rows.

`CATALOG_CACHE_REVISION` moved to `2026-11-22-catalog-resource`.

## Not tested

Anymd Pro itself, any Ironclad or Diligent account, deployed operation. Page reads only.
