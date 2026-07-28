# Product ideas recovered from the phantom listings

On 2026-07-28 a link audit found nine listings on legalaimcp.com pointing at
things that did not exist — five at domains with **no DNS record at all**, four
at 404'd GitHub repos. All were created 2026-04-08, `source=curated`,
`verified=false`, and three were featured on the homepage. They were retired
(`status='rejected'`, so the rows survive) and removed from the live site.

The accidental upside: they are decent legal-AI product briefs, and most of the
domains are unregistered. This is that list, kept so the work isn't lost.

**Nothing here is built. Nothing here is claimed. Do not list any of these on
the directory until it actually exists** — that is the exact failure being
cleaned up.

## Domain availability — checked 2026-07-28

| Domain | Status | Price/yr |
| --- | --- | --- |
| `docgen.legal` | **available** | $9.99 |
| `billbot.legal` | **available** | $9.99 |
| `emaildrafter.legal` | **available** | $9.99 |
| `mattersync.io` | **available** | $37.99 |
| `dockettrack.io` | **available** | $37.99 |
| `docketrack.io` (one-t variant) | **available** | $37.99 |
| `complianceguard.io` | taken | — |
| `mattersync.com` / `.ai` | taken | — |
| `dockettrack.com` | taken | — |

The `.legal` TLD is cheap and on-the-nose. Re-check before buying — availability
moves.

## The concepts

### DocketTrack — court docket monitoring + deadline alerts
`case_management` · freemium · `dockettrack.io`
Real-time docket monitoring with deadline alerts. **Strongest commercial case
of the nine:** missed deadlines are malpractice, so willingness to pay is high
and the buyer is the firm, not an individual. Competitive though — Docket Alarm,
PacerPro and Trellis all exist. Wedge would be AI-native alerting and MCP access
rather than another dashboard.

### BillBot Legal — AI time tracking and invoice generation
`billing_time` · paid · `billbot.legal`
Billable-hour capture is the most-complained-about task in a law firm and the
one most obviously suited to passive AI capture. Clio and TimeSolv own the
incumbent slot, but they make you *log* time; the wedge is inferring it.

### CaseLaw Search MCP — federal + state case law from your AI assistant
`legal_research` · ~~free · open source~~ · **RESOLVED 2026-07-28: DO NOT BUILD**
The premise died on contact with research: Free Law Project shipped their own
official hosted MCP server (`mcp.courtlistener.com`, May 2026), and FLP's terms
prohibit membership-tier API access from powering commercial products. A clone
adds nothing and a hosted commercial wrapper needs a negotiated agreement.
The directory play won instead: the official server, a self-hostable community
one (blakeox), and a citation-hallucination checker (john-walkoe) are now
published listings. The "zero first-party tools" gap this entry existed to fix
was closed separately — legalaimcp.com now runs its own MCP server
(`com.legalaimcp/directory` in the official registry).

### ComplianceGuard — regulatory change monitoring by practice area
`compliance` · freemium · domain taken, needs a new name
Track regulatory changes affecting a firm's practice areas. Real market, real
recurring value. Name needs replacing.

### MatterSync — sync matter data across a firm's tools
`case_management` · paid · `mattersync.io`
Integration/middleware play. Honest read: hardest of the nine. Integration
businesses need partnerships and per-connector maintenance forever, and the
value is invisible until something breaks.

### DocGen Legal — AI document generation from templates
`document_processing` · paid · `docgen.legal`
Very crowded (every practice-management suite has document assembly). Only
interesting with a sharp niche.

### EmailDrafter Legal — AI client emails with firm tone + compliance checks
`client_communication` · freemium · `emaildrafter.legal`
Likely a **feature, not a company** — this is a capability inside a larger
product rather than something a firm buys separately.

### LegalMind Contract Analyzer — AI contract review
`document_processing` · freemium
The most crowded category in legal AI (Luminance, Spellbook, Robin, Harvey).
Needs a very specific wedge to be worth entering. "LegalMind" also has existing
users of the name — check before adopting.

### LexisConnect MCP — bridge an AI assistant to LexisNexis
`legal_research` · contact
⚠️ **Do not use this name.** "Lexis" is LexisNexis's trademark and this would sit
squarely in their field — the textbook confusion case. The *idea* (MCP bridge to
a major research provider) is fine; the name is not, and any such bridge needs
to respect the provider's terms of service.

## If you pick one

~~Build **CaseLaw Search MCP** first.~~ **Superseded 2026-07-28** — see the
CaseLaw entry above: the official first-party server made building it
pointless, and the directory's first-party-tool gap was closed by shipping
`com.legalaimcp/directory` instead. Of what remains, **DocketTrack** has the
strongest commercial case (missed deadlines are malpractice; the buyer is the
firm) — but hunt first: this list has now produced one build-avoided-by-search,
and that lesson was cheap only because the search happened before the build.
