# 2026-11-27: MAK Immigration Source Guide admitted

Claude Sonnet 5.5, 2026-11-27. Admits one pending submission (id c6865195-a1d5-4129-b3cf-b25580803908) as `/servers/mak-immigration-source-guide`. The owner said admit.

## What changed

- `lib/catalog-reviews.json`: one new approved review record for `mak-immigration-source-guide`, with five vendor quotes, their page fingerprints, the listing claims, an operator block and a `realness_ack` (see below).
- `lib/catalog-realness.json`: one new record (level watch, reason: the domain has no mail records). Other records are unchanged; only `generated_at` moved.
- `lib/supabase.ts`: `CATALOG_CACHE_REVISION` is now `2026-11-27-intake-2` (was `2026-11-27-intake-1`) so cached catalog reads refresh after the apply.
- The SQL pack (guard, apply, rollback, readback) sits outside this repo, in the ops run folder `sqlpack-mak/`. It is not applied. The listing row is created published with `verified` false, and the submission is marked approved.

## What there was before

Nothing. The catalog had no listing for this product. The submission stayed pending.

## Why

The vendor runs a remote MCP server that points to official Government of Canada and Justice Laws immigration sources. It is in scope as a legal research source. Every claim on the listing is the vendor's own words, marked as the vendor's, or something we saw.

## What was checked

- The firm's page https://makimmigration.ca/mak-immigration-source-guide/ exists and links to the guide at https://mak-public-rcic-mcp.vercel.app/sources. It does not name the MCP address.
- The MCP address answered an MCP handshake as "mak-canadian-immigration-sources" version 1.4.13. We ran no tool.
- The vendor's server card (/.well-known/mcp.json) names the MCP address. The official MCP registry lists an active entry for the same address.
- Price: no page we read states one (guide page, /sources, /sources.json, the firm's page, the server card). The listing says "Not stated by the vendor". The submission said the guide is free; we did not repeat that.
- Topic count: the firm's page says nine and the guide says eighteen. The listing uses only the guide's own wording.
- Operator: the CICC public register, searched by company name only, lists "MAK Canadian Immigration Services" on two licensees, both entitled to practise. That is a regulator's list of licensees. It is not a company register and gives no formation date, so the listing shows none.

## What was not checked

- No incorporation record for the firm. Corporations Canada (federal) returned no match for the exact name. A federal corporation with a similar name has a registered office in British Columbia; nothing we read ties it to this firm, so we did not use it. The Ontario Business Registry needs an interactive search and was not read. OpenCorporates and two Canadian company directories blocked automated readers; we did not try to get past them.
- What the tools return, and whether the sources are accurate and current.
- The registry entry's repository is not public, and the firm's pages do not link to the registry account. The registry check in `catalog-realness.json` shows "unknown" because the host is a shared host.

## The watch result

The realness check marks the listing `watch` because vercel.app has no mail records of its own. The record carries a `realness_ack` saying why: the firm's own domain has mail, the firm is on the CICC register, and the owner said admit.

## Open after the apply

`npm run build` has a post-build check that needs the listing row in production. It fails for this slug until the apply runs. That is expected.
