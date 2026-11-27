# Wording batch, 2026-11-27

Claude Sonnet 5.5, 2026-11-27. Owner approved this batch on 2026-11-27.

15 field changes on 12 listings. Each change fixes a statement the vendor page does not support, or adds a fact the page shows. The database rows change through `apply.sql` (not in this repo). This branch holds the matching review records in `lib/catalog-reviews.json` and a cache revision bump (`2026-11-27-intake-2` to `2026-11-27-intake-3`).

All sources were re-read on 2026-11-27. Old wording that named a person is not repeated here. The three old creator names are kept only in a private backup table in the database.

## Owner decisions

1. Merit register date: the listing states both dates and says who gave each.
2. uk-legal-mcp creator is shown as BOUCH, the name the maintainer README gives.
3. Three vendor pages changed since review (merit-ukrainian-law-registers, precision-ai-os, vaquill-ai). Every recorded quote was re-read. Merit and Precision AI OS kept every quote, so their source fingerprints were refreshed. Vaquill AI lost one quote, so its fingerprints were not refreshed (see the last section).

## Changes

### merit-ukrainian-law-registers
- creator_name. Was: a personal name with a repeat. Now: "Merit (sole proprietor, Ukraine)". Why: the offer page names the service Merit and says the operator is a sole proprietor. Source: https://merit.legal/mcp/offer
- description. Was: "The operator is a sole proprietor whose Ukrainian registry entry is dated 29 October 2026, so the business is very new." Now: the vendor's offer says 29 October 2026 and a public mirror of the register showed 30 October 2026 when we checked on 23 November 2026. Why: the two dates differ and each is attributed. The mirror date comes from the earlier review record and was not re-read today. Source: https://merit.legal/mcp/offer

### lexery
- creator_name. Was: a personal name with a repeat. Now: "LEXERY (sole proprietor, Ukraine)". Why: the terms name a sole proprietor and the brand on every page is LEXERY. Source: https://lexery.com.ua/terms

### uk-legal-mcp
- creator_name. Was: a personal name with a repeat. Now: "BOUCH". Why: the maintainer README says "Maintained by BOUCH". Source: https://raw.githubusercontent.com/paulieb89/uk-legal-mcp/main/README.md

### precision-ai-os
- description. Was: "from Precision AI LLC in Miami, Florida" and "Pricing is credit based, never per seat." Now: the terms call the company a Florida limited liability company, the privacy page gives Miami, Florida, and the pricing page marks Free and Team as coming soon and says Managed is taking discovery calls. Sources: https://getprecision.ai/legal/terms, https://getprecision.ai/legal/privacy, https://getprecision.ai/pricing
- pricing_details. Was: empty. Now: credit based; a Free plan and a Team plan at $100 a month ($85 with an annual commitment), both marked coming soon; Managed by discovery call; prices exclude tax. Why: the page lists them and the listing had nothing. Source: https://getprecision.ai/pricing

### leela
- description. Was: "Humblepaper, Inc. of New York." Now: the vendor says it is a US corporation with founders based in India, its pages give a New York mailing address, and the terms say the product was formerly called Outbox Black. Why: "of New York" stated more than the vendor does. Sources: https://leela.works/about, https://leela.works/terms

### specterai
- description. Was: no founding or operator dates. Now: the about page says founded in 2024 in Germany and the footer shows Stuttgart. The terms name ROLIDE SRL of Bucharest as operator, and a Romanian tax authority record shows that company registered on 30 January 2026. Why: the two accounts differ and each is attributed. The register is a third-party record, so it is described and not added as a source. Sources: https://www.specterlaw.ai/ueber-uns, https://www.specterlaw.ai/nutzungsbedingungen

### legalmcp
- description. Was: no note on the install command. Now: the README tells users to run the PyPI install command, but PyPI has no package named legal-mcp or legalmcp (both lookups returned 404 on 2026-11-27 and 2026-11-26). The README also shows an install from GitHub. Last push 19 June 2026. Why: a reader who follows the README line gets an error. Source: https://raw.githubusercontent.com/Mahender22/legal-mcp/main/README.md. The review gate strips text between angle brackets, so the install line cannot be stored as a quote.

### uk-legal-skills
- description. Was: no licence history. Now: first published 8 June 2026 under MIT, changed to the Functional Source License later that day; source-available, not open source; 16 public commits over 8 and 9 June 2026. Why: the old text did not say the licence changed. Sources: https://raw.githubusercontent.com/davendra/uk-legal-skills/3ff45e8a6b5cd896150180a28d10f32188871fec/LICENSE (first commit), https://raw.githubusercontent.com/davendra/uk-legal-skills/main/LICENSE.md (now). The commit list is the GitHub API list for the repository.

### uk-case-law-mcp-server
- description. Was: no history and no re-use note. Now: one public commit, "New Repo Public", on 28 December 2025; the National Archives says its Open Justice Licence does not permit computational analysis and bulk programmatic searching needs a licence. Why: readers need the condition before use at scale. Source: https://caselaw.nationalarchives.gov.uk/re-use-find-case-law-records (described, not a vendor source).

### taiwan-legal-rag
- description. Was: no licence or history note. Now: Elastic License 2.0 from version 2.0.0, MIT up to 1.2.2; first PyPI upload 27 May 2026, version 2.0.0 on 9 August 2026; one person runs the service and the about page names no company; the hosted terms bar resale and bulk mirroring of the corpus without a separate written agreement. Sources: https://raw.githubusercontent.com/aa0101181514/tw-legal-rag/main/README.md, https://pypi.org/pypi/twlegalrag/json, https://dr-legal.com.tw/about, https://raw.githubusercontent.com/aa0101181514/tw-legal-rag/main/TERMS.md

### signal87-ai
- description. Was: one framing. Now: the home page calls it an enterprise document memory and legal AI research platform; the terms call it an AI-powered document intelligence and research platform. Why: use both vendor phrases. Sources: https://www.signal87.ai/, https://www.signal87.ai/terms

### vaquill-ai
- tagline. Was: the earlier tagline. Now: "US statutes, regulations, court rules and case law as MCP tools and an API". Source: https://www.vaquill.ai/llms.txt
- description. Adds what the README and llms.txt list: constitutions, court rules, the Federal Register, executive orders, agency guidance, case law tools, 20M+ case records, 52 read-only US tools, and a note that the Indian servers are not covered. Sources: https://raw.githubusercontent.com/vaquill-AI/vaquill-mcp/main/README.md, https://www.vaquill.ai/llms.txt

## Review record edits (lib/catalog-reviews.json)

- Claims and listing fingerprints for all 12 slugs, from the approved patch.
- Fingerprints refreshed: merit-ukrainian-law-registers (3 pages) and precision-ai-os (pricing and law-firms pages). Every recorded quote was found on each page word for word first.
- The review gate allows five sources per record. To stay inside it:
  - precision-ai-os: the privacy page replaces the about page (same location fact), the terms page is added, and the pricing quote now spans the credit and Team plan text.
  - leela: the terms quote now holds the operator and the former name. It keeps the page's `&quot;` text because the gate does not decode entities.
  - specterai: the about page replaces the docs page. The Specter Cite page quote now includes the server address.
  - signal87-ai: one terms quote added.
  - uk-legal-skills: two licence quotes added.
- Not touched on purpose: ailex-v2, court-rules, gleanmark-trademark-search, captainlegal (finding 10: the data is right and the label fix is on another branch), esgenix, voicefleet, qanu, and the finding 15 listing text.

## Vaquill AI source fix (follow-up commit, 2026-11-27)

Claude Sonnet 5.5, 2026-11-27. The owner read https://www.vaquill.ai/about and found the fact unchanged, only reworded. In the vaquill-ai record:
- The about-page quote changed. Was: "Vaquill AI covers the complete US Code, the CFR, and all 56 state and territory statute codes: 6M+ sections, normalized, cross-referenced, and citation-addressable." Now: "6M+ sections across the US Code, the CFR and all 56 state and territory codes, reached through a REST API, an MCP server". The gate's text extraction keeps this whole span in one piece.
- All five quotes were found on their pages, so all five source fingerprints were refreshed (terms, about, mcp, llms.txt, README).
- Claims were not edited, so the database fingerprint is unchanged. The listing says "56 state and territory statute codes (6M+ sections per the vendor)", which the new quote backs. The listing does not say "complete", "normalized", "cross-referenced" or "citation-addressable", so nothing leans on the old wording.

## Names off the listing pages (follow-up commit, 2026-11-27)

Claude Sonnet 5.5, 2026-11-27. Individuals' names stay off the site. Six sources held a quote with a personal name or an email address. Each now has `show: false`, so the quote stays in the record as evidence but is not printed on the listing page.
- Slugs, all source position 0: merit-ukrainian-law-registers, lexery, uk-legal-mcp, uk-legal-skills, uk-case-law-mcp-server, taiwan-legal-rag.
- Prior behavior: all six quotes were shown on the page.
- No quote text, claim or fingerprint changed. The post-build check skips `show: false` sources (`scripts/catalog-artifact-evidence.mjs`, line 13).

## Superseded note: vaquill-ai

The text below was true when this batch was first committed. The follow-up above replaces it.

The about page no longer holds the recorded sentence "Vaquill AI covers the complete US Code, the CFR, and all 56 state and territory statute codes: 6M+ sections, normalized, cross-referenced, and citation-addressable." It now says "6M+ sections across the US Code, the CFR and all 56 state and territory codes, reached through a REST API, an MCP server and Open US Law." The source fingerprints in the vaquill-ai record stay at their old values and need a new human review. The new listing text rests on the README and llms.txt, which still hold the facts.

## Order of operations

1. Apply `apply.sql` to the database, then run `readback.sql` (every row `ok = true`).
2. Merge and deploy this branch right after.
3. Run `cleanup.sql` once the deploy is live.
If anything fails after apply, run `rollback.sql`.
