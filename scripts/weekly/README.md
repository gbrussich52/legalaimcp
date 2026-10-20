---
classification: PUBLIC
---
# LegalAIMCP information flow

The existing Monday 09:30 local maintenance job runs three independent phases:

1. Verify published listing links using the existing badge/three-failure policy.
2. Discover maintained GitHub candidates into the existing admin review queue.
3. Collect primary connection documentation, official MCP Registry candidates and a real production MCP check.

No new schedule, model download, account or paid service. Research uses installed local gpt-oss:20b, with one bounded gemma3:12b fallback; never a remote inference API. This extends the registered weekly loop; scheduled use requires the owner's signed loop approval. The laptop must be awake/online; inspect health artifacts rather than assuming a calendar trigger ran.

## Run and check

From the project directory:

```
npm run information:check
npm run information:validate
npm test
```

The first command performs public read-only requests and saves local evidence under `scripts/weekly/logs/`. It does not run listing verification/database updates. The existing full runner still performs its previously authorized writes in phases 1 and 2.

- `information.json`: last observations, stable reviewed baselines and unresolved Registry proposals.
- `information-health.json`: starts red before fetching; incomplete/failed runs cannot reuse earlier green.
- `improve-queue.md`: repairs first, changed/stale vendor documentation second, discovery proposals third.
- `weekly-health.json`: all three phase exits; zero new candidates is valid, collection failures are not.

Source checks use the same `lib/software-connections.json` evidence as the website and MCP. Content fingerprints exclude script/navigation noise. A content change stays open until a person or interactive agent verifies the primary source and updates its reviewed date in a tested change. A fetch never updates the public review date or proves account compatibility. Sources older than 30 days remain review work even when their content has not changed.

Registry proposals retain publisher name/version/source, first/last observation, and candidate status. Registry inclusion does not establish official vendor support, license safety, real setup, quality or account compatibility. Existing GitHub discovery remains separate. Duplicate-check against the actual directory/admin queue before admission. The Registry collector caps each of six queries at two pages of 30 records; hitting the cap is explicitly incomplete. Requests have time/byte/redirect limits and allowlisted HTTPS destinations; candidate URLs are never followed. No cookies, secrets, customer data, arbitrary page instructions or source prose enter an agent prompt. Bounded public excerpts are read locally by Ollama; only source fingerprints, short supporting quotations and unverified findings are retained. No excerpt goes to a remote model.

## Improve, verify, distribute, sense

At the next review, repair the highest-priority failure first. Verify changed permissions/setup directly with the vendor; then consider one maintained, relevant new tool. Use existing admission/review paths, relevant tests and build artifact checks. Check the deployed result before closing the item. This collector gathers evidence and proposes work; it never changes software claims, approves submissions, opens accounts or deploys code unattended.

The local model reads and ranks evidence each run; it has no tools and cannot execute proposed changes. This deliberately retains review before publication. Compare useful proposals and false positives after four observed runs; narrow or remove redundant checks if they add noise. This workflow replaces repeated manual vendor checks and merges discovery evidence into the existing weekly job rather than adding a second monitoring service.

## Local research and decisions

`local-research.mjs` contains the research guidance. It prioritizes changed setup/permissions, requires exact supporting quotations, marks uncertainty, and forbids unsupported official/security/compatibility claims. Each run permits at most two 90-second model calls, 8,192 context tokens and 1,200 output tokens. The endpoint is fixed loopback, redirects are rejected, no tools are supplied, and models unload after their request. Invalid/unavailable local output leaves health red and retains deterministic evidence; there is no paid fallback. The local Ollama-compatible service must be running at 127.0.0.1:11434.

A reviewer can retain admission/dismissal decisions in ignored `scripts/weekly/logs/decisions.json`, keyed by Registry server name, with `status` (accepted/dismissed), exact `version`, `reason`, and ISO `reviewedAt`. Same-version decisions stay closed in regenerated reports; new versions reopen review. Never treat report checkboxes alone as durable decisions. The collector does not write decisions.
