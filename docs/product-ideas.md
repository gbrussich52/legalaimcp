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
`legal_research` · free · open source
**The one worth building first, for a reason unrelated to revenue.**
legalaimcp.com is a directory of legal MCP servers that ships zero first-party
tools. A genuinely useful open-source case-law MCP would give the directory a
flagship, a reason to visit, and real authority for the AEO play — LLMs cite
tools, not listings. Free and open by design; the return is distribution and
credibility for the directory, not licence revenue.

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

Build **CaseLaw Search MCP** first. It is the only one where the payoff isn't
just a new product — it makes an asset you already own credible, and it is the
concrete thing the AEO strategy has been missing.
