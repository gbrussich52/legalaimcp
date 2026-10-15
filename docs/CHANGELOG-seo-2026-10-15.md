# SEO/GEO changelog — 2026-10-15 (branch seo-geo-2026-10-15)

Source: geo-optimizer audit 2026-10-15. Not deployed or pushed.

## Changed
- `app/components/FAQ.tsx`: homepage FAQ now emits FAQPage JSON-LD via the existing `FAQJsonLd`, built from a plain-text `text` field added to each of the 5 visible Q&As (copied from the visible answers).
  - Prior: homepage FAQ had no structured data (category and guide pages already did). Audit: "FAQPage schema missing".
- `app/components/JsonLd.tsx` + `lib/constants.ts`: WebSite JSON-LD gains `dateModified` (`SITE_LAST_MODIFIED = 2026-10-15`). Organization gains `contactPoint` with `hello@legalaimcp.com`, the address already published on /privacy and /terms.
  - Prior: no date signal; no contact info in schema (audit: "Contact information missing").
- `app/sitemap.ts`: home `lastModified` bumped to 2026-10-15 (FAQ schema added); `/pricing` previously shared `MODIFIED.home`, now pinned to its old 2026-09-08 so it is not falsely re-dated.

## Already present (no change)
- Organization `sameAs` (GitHub profile, repo, Glama listing) and founder sameAs (LinkedIn, GitHub, gianibrussich.com). No new profile URLs were added; none beyond these exist in the repo. The official MCP registry URL is not recorded in the repo as a URL, so it was not added.

## Needs Giani
- Phone number and street address: not in the repo, so not added.
- Official MCP registry listing URL (for sameAs), if wanted.
- Author byline for Google (audit G-BYLINE): needs a decision on who is credited on pages.
