# Firecrawl listing: Alexandria URL and compliance pointer (2026-11-15)

Claude Fable 5.2, 2026-11-15. Firecrawl's growth team wrote to hello@legalaimcp.com asking for two changes. Both were checked against Firecrawl's own pages before anything changed.

## 1. Listing destination

What changed: `firecrawl-gov-index` now links to `https://alexandria.firecrawl.dev/firecrawl-gov-index`.

What it did before: linked to `https://www.firecrawl.dev/gov-index`. That page still loads, and it now titles itself "Firecrawl Alexandria / Government & Legal Index" and names the `firecrawl-gov-index` provider in Alexandria.

Why: the vendor asked for it, the new host is a subdomain of the listing's creator domain, and the page describes the same product. No other public claim changed: name, tagline, description, pricing and tags are word for word what was approved on October 29.

Review: all three recorded vendor sources had changed since October 29, so the listing was due for a fresh read anyway. Each was read again on November 15 and still supports every claim; each supporting quote is still present. The Alexandria page is the destination only, not a fingerprinted source: it prints live call counts and latency, so its hash would change daily and trip the weekly source check for no reason.

Apply: `scripts/catalog-firecrawl-alexandria-url.json` through `scripts/import-reviewed-catalog.mjs` (dry run, `--rollback-test`, then `--apply`), which binds the exact before-claims. `CATALOG_CACHE_REVISION` moved to `2026-11-15-firecrawl-alexandria-url`.

Not tested: account access, the connector, or search completeness. Firecrawl offered free credits; none were taken.

## 2. Compliance list

Asked: add Firecrawl Alexandria to `/best/compliance-mcp-servers`.

Done instead: Alexandria as a whole is a general data library, not a compliance product, and the index is a legal research listing. So it is not a compliance-category row. The compliance pages now carry a short pointer section, "Find the statute or regulation behind a rule", that links to the listing. Firecrawl's own docs describe that use ("Read the statute or code section behind a compliance question").

The pointer sections used to render only on `/categories/{slug}`. They moved into `app/components/CategoryFocusSections.tsx` and now also render on `/best/{slug}-mcp-servers`, below the roundup and outside its ItemList schema. The category page output is unchanged. No new schedule, model or service.
