/**
 * Editorial content for category landing pages.
 *
 * WHY THIS FILE EXISTS: category pages were an h1, one database sentence, and
 * a card grid. For the long-tail queries this site can actually win ("AI
 * contract review tools for law firms"), that's a list, not a landing page —
 * thin content neither ranks nor persuades. This layer adds what a buyer
 * actually needs: what the category covers, how to choose, and the questions
 * they'd otherwise bounce back to Google to ask.
 *
 * CONTENT RULES (these are load-bearing — see the 2026-07-28 integrity
 * cleanup that removed six unbacked claims from this site):
 * - No invented statistics, user counts, or outcomes. Ever.
 * - No legal advice. We're engineers; ethics questions get pointed at the
 *   reader's own state bar, same posture as the checklist and footer notice.
 * - Selection criteria are software-evaluation judgment, which we CAN stand
 *   behind — that's product analysis, not law.
 * - FAQ answers must be true of the category in general, not of specific
 *   tools we haven't tested.
 */

export interface CategoryFaq {
  q: string
  a: string
}

export interface CategoryContent {
  /** Search-intent headline, used as the page h1 in place of the bare name. */
  headline: string
  /** 2–3 paragraph buyer's-guide intro. Plain strings, rendered as <p>s. */
  intro: string[]
  /** "What to look for" bullets — software-evaluation criteria only. */
  criteria: string[]
  faqs: CategoryFaq[]
}

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  'document-processing': {
    headline: 'AI Document & Contract Tools for Law Firms',
    intro: [
      'Document work is where legal AI is most mature and most crowded: contract review, clause extraction, redlining, due-diligence sweeps, and document generation all have credible tools behind them. It is also the category where the difference between products is least visible from a marketing page — nearly everything claims to "review contracts with AI."',
      'The practical differences are narrower and more checkable: which document types the tool was actually built for, whether it works inside the software you already draft in, and what happens to a document after you upload it. Tools with an MCP integration add a further option — connecting document analysis directly to an AI assistant like Claude or ChatGPT, so review happens in conversation rather than in another portal.',
    ],
    criteria: [
      'Match to your documents: a tool tuned for M&A due diligence behaves very differently from one built for NDAs and vendor agreements. Test on your own documents, not the demo set.',
      'Where the work happens: inside Word, inside the tool’s portal, or via an AI assistant over MCP. Every extra place a document must be copied to is friction and a data-handling question.',
      'Data handling: where uploads are stored, how long they’re retained, and whether your documents train the vendor’s models. Get it in writing.',
      'Output format: a tool that returns a marked-up document you can accept or reject beats one that returns a summary you must re-apply by hand.',
    ],
    faqs: [
      {
        q: 'Can AI actually review a contract reliably?',
        a: 'For extraction and first-pass issue-spotting — finding clauses, flagging deviations from a playbook, summarizing terms — current tools are genuinely useful and fast. For judgment calls, market-standard questions, and anything with liability attached, treat the output as a draft for a lawyer to review, not a finished work product. Vendors in this category say the same thing in their own terms of service.',
      },
      {
        q: 'What does MCP add for document work?',
        a: 'MCP (Model Context Protocol) lets an AI assistant call a tool directly. Instead of uploading a contract to a separate portal, you can ask an assistant to run the analysis and return results in the same conversation where you’re already working. Listings here note which tools ship an MCP server and include the install command where one exists.',
      },
      {
        q: 'Is it safe to upload client documents to these tools?',
        a: 'That depends entirely on the vendor’s data handling, and it’s a question to resolve before adoption, not after. Our free vetting checklist walks through the specific data-privacy questions to ask. For the ethics dimension, confirm against your own state bar’s guidance — we’re a software directory, not a source of legal advice.',
      },
    ],
  },

  'case-management': {
    headline: 'AI Case & Matter Management Tools for Law Firms',
    intro: [
      'Case management AI splits into two different products that get marketed with the same words: practice-management platforms adding AI features (intake summaries, document drafting inside the matter), and standalone tools that watch dockets, track deadlines, and automate workflow steps. Which one you need depends on whether your problem is "our system is dumb" or "we have no system."',
      'This category rewards integration above all else. A brilliant docket tracker that doesn’t talk to your practice-management system just creates a second place to check. The MCP angle matters here for the same reason — a case-management tool exposed over MCP lets an AI assistant query matter status, deadlines, and documents without anyone logging into anything.',
    ],
    criteria: [
      'Integration first: if it doesn’t connect to the practice-management system you already run (or replace it wholesale), the data will be stale within a month.',
      'Deadline handling: for anything touching court dates, ask how the tool sources dates, how it handles rule changes, and what its failure mode is. A missed-deadline tool that fails silently is worse than a calendar.',
      'Migration path: ask what exporting your data looks like on the way out, before you move it in.',
      'Who it’s for: solo/small-firm tools and BigLaw tools differ mostly in admin overhead. Buying above your size costs you a part-time administrator.',
    ],
    faqs: [
      {
        q: 'Should I replace my practice-management system to get AI features?',
        a: 'Usually not as a first move. The incumbents in this space are adding AI features steadily, and switching systems is one of the most disruptive projects a firm can take on. The stronger first step is usually a focused tool that fixes your sharpest pain point and integrates with what you have. If your current system has no AI roadmap and no integrations, that’s a different conversation.',
      },
      {
        q: 'What can an AI assistant do with case management over MCP?',
        a: 'With an MCP connection, an assistant can answer questions like "what’s due this week across my matters" or "summarize the latest filings in this case" directly, pulling from the tool’s live data instead of your memory of it. Tools shipping MCP servers are marked in their listings.',
      },
      {
        q: 'Are deadline-tracking AI tools reliable enough to depend on?',
        a: 'Treat them as a second calendar, not a replacement for your docketing discipline — that’s also what their own terms of service will tell you. Evaluate the failure mode above the feature list: a tool that alerts you when it can’t verify a date is safer than one that guesses.',
      },
    ],
  },

  'client-communication': {
    headline: 'AI Client Intake & Communication Tools for Law Firms',
    intro: [
      'Client-communication AI covers the front door of a practice: intake forms that actually get completed, chat that answers after-hours questions, follow-up sequences that don’t depend on someone remembering, and drafting help for routine client email. For consumer-facing practices, this is often the highest-ROI category in the directory — unanswered intake is revenue walking away.',
      'It’s also the category with the most direct client contact, which raises the bar on tone and accuracy. A hallucinated answer in an internal research memo gets caught by a lawyer; a hallucinated answer in a client-facing chat is a problem the moment it’s sent. Look hard at what each tool lets you constrain.',
    ],
    criteria: [
      'Constraint controls: can you limit what the AI is allowed to say, hand off to a human at defined trigger points, and review transcripts? Unconstrained client-facing chat is a liability generator.',
      'Intake-to-system flow: an intake bot that doesn’t write into your case-management or CRM system just creates retyping work.',
      'Escalation design: the best tools in this category are designed around knowing when NOT to answer.',
      'Tone fit: test whether the output sounds like your firm or like a generic bot. Clients notice.',
    ],
    faqs: [
      {
        q: 'Will clients accept talking to an AI?',
        a: 'For scheduling, status checks, and intake questions at 9pm — broadly yes, and the alternative is usually voicemail, not a human. For substantive matters, clients want the lawyer, and the tool’s job is to capture the question, set expectations, and route it. Tools that blur that line are the ones to avoid.',
      },
      {
        q: 'Can an AI chatbot give legal advice by accident?',
        a: 'It can certainly produce text that reads like advice, which is why constraint controls are the first evaluation criterion in this category. Configure hard limits on scope, keep a human in the loop for anything substantive, and check your state bar’s position on client-facing AI communication — that last part is your call to verify, not ours to answer.',
      },
      {
        q: 'What’s the difference between these tools and a general chatbot like ChatGPT?',
        a: 'Purpose-built legal intake tools ship the guardrails, intake flows, and practice-management integrations that a general assistant lacks out of the box. A general assistant connected over MCP to your systems can close some of that gap — several tools in this category exist precisely to be that bridge.',
      },
    ],
  },

  'legal-research': {
    headline: 'AI Legal Research Tools & Case Law Search',
    intro: [
      'Legal research is the category where AI’s failure mode is most famous — invented citations have made national news more than once — and also where the mature tools have moved furthest to fix it. The current generation retrieves real sources first and drafts from them, rather than generating from memory, and the difference between tools is largely the quality of that retrieval layer.',
      'Coverage is the other quiet differentiator. Federal case law is broadly available; state coverage, agency materials, secondary sources, and how current the database is vary widely between products — and between price tiers of the same product. A tool is only as good as the corpus behind it.',
    ],
    criteria: [
      'Citation verification: does every proposition link to a real, checkable source? Tools that show their retrieval beat tools that ask for trust.',
      'Coverage for YOUR practice: confirm the states, courts, and materials you actually cite are in the corpus and current. Ask for the coverage list in writing.',
      'Workflow fit: research that exports cleanly into your drafting beats a better answer trapped in a portal.',
      'Cost structure: per-seat, per-search, and flat-rate pricing produce very different bills at small-firm scale.',
    ],
    faqs: [
      {
        q: 'Can I trust AI research tools after the fake-citation cases?',
        a: 'The reported sanctions cases have generally involved lawyers filing unverified output from general-purpose chatbots, not from retrieval-based legal research tools — but the lesson applies everywhere: verify every citation before it goes in a filing. The mature tools make that verification fast by linking each claim to its source. Any tool that can’t show you the underlying document is asking you to do the old research anyway.',
      },
      {
        q: 'Are there free or low-cost options for case law search?',
        a: 'Yes — the free tier of this category is stronger than most lawyers expect. CourtListener (run by the nonprofit Free Law Project) offers free search across millions of opinions, and several tools listed here build on public case-law data. Free tiers typically trade off coverage breadth, update speed, and analysis features rather than the underlying documents.',
      },
      {
        q: 'What does an MCP server change about legal research?',
        a: 'It lets an AI assistant run searches against a real case-law database mid-conversation — so instead of "find me cases about X" producing text from the model’s memory, it produces results retrieved from an actual corpus, with links. That grounding is exactly the fix for the fake-citation problem, applied at the tool layer.',
      },
    ],
  },

  'billing-time': {
    headline: 'AI Time Tracking & Billing Tools for Law Firms',
    intro: [
      'Billing AI attacks the most disliked task in a law firm from two directions: passive capture (watching your actual work — documents, email, calls — and drafting time entries from it) and post-hoc automation (turning notes into compliant entries, scrubbing bills against client guidelines, chasing receivables). Passive capture is the bigger promise and the bigger privacy question, since it works by observing everything you do.',
      'The measurable payoff in this category is unusually concrete: captured time that would otherwise never be billed, and rejected-entry rates on guideline-reviewed bills. It’s one of the few legal AI categories where you can run a before/after on your own numbers within a month.',
    ],
    criteria: [
      'Capture scope and control: exactly what does the tool observe, where does that observation data live, and can you exclude matters or clients from capture entirely?',
      'Billing-system fit: entries must land in your actual billing system in your format — including e-billing and client-guideline formats where relevant.',
      'Edit friction: drafted entries you accept in one click are a win; drafted entries you rewrite are a second timekeeping job.',
      'Trial on real weeks: run it against two normal weeks and compare captured hours to what you actually billed. This category makes that test easy — use it.',
    ],
    faqs: [
      {
        q: 'Does passive time capture actually find billable time?',
        a: 'The mechanism is real: work that happens in two-minute fragments — a quick email, a short call — is exactly what manual reconstruction at day’s end drops, and continuous capture doesn’t forget it. How much that recovers varies by practice and habits, which is why the two-week self-trial matters more than any vendor number.',
      },
      {
        q: 'What about client confidentiality with a tool that watches everything?',
        a: 'It’s the central question for passive capture, and the vendors know it — look for matter-level exclusions, local processing options, and clear retention terms. Where the observation data goes is a harder question than where a single uploaded document goes. Our vetting checklist covers the specific questions; your state bar’s guidance covers the ethics side.',
      },
      {
        q: 'Is this worth it for a flat-fee or contingency practice?',
        a: 'Capture matters less when you don’t bill by the hour, but the same tooling often doubles as cost accounting — knowing what a matter type actually costs you in hours is how flat fees get priced on data instead of guesswork.',
      },
    ],
  },

  compliance: {
    headline: 'AI Compliance & Regulatory Monitoring Tools',
    intro: [
      'Compliance AI does surveillance at a scale humans can’t: watching regulatory feeds across jurisdictions, mapping changes to the obligations a client actually has, and drafting the assessment work that follows. The category serves two distinct buyers — law firms advising clients on compliance, and in-house/ops teams running their own programs — and most tools lean clearly toward one or the other.',
      'The evaluation question that matters most here is the false-negative rate you can’t see: a monitoring tool earns its keep on the change it catches that you’d have missed, and quietly fails on the one it misses that you’d assumed was covered. Scope clarity — exactly which sources, jurisdictions, and topics are monitored — is worth more than any AI feature.',
    ],
    criteria: [
      'Source transparency: demand the actual list of monitored sources and jurisdictions, and how quickly changes appear after publication.',
      'Mapping to obligations: alerts about everything are alerts about nothing. The useful tools filter changes against your (or your client’s) actual regulatory footprint.',
      'Audit trail: for compliance work, the record that you monitored and assessed is part of the product. Check what the tool retains and exports.',
      'Human review points: assessment drafts need a defined review step before they become the record. Tools that assume this workflow beat tools that let drafts flow straight through.',
    ],
    faqs: [
      {
        q: 'Can AI monitoring replace a compliance officer or outside counsel?',
        a: 'No — it changes what they spend time on. The tools compress the watching and first-pass triage; deciding what a change means for a specific business, and what to do about it, stays a human judgment. Vendors positioning otherwise are the ones to scrutinize hardest.',
      },
      {
        q: 'How do I evaluate coverage claims like "monitors 1,000+ sources"?',
        a: 'Ask for the list, then check it against the specific regulators and jurisdictions that matter to you. Broad source counts are marketing; the only coverage that matters is yours. A tool monitoring 50 sources that include all of yours beats one monitoring thousands that miss two of them.',
      },
      {
        q: 'Where does MCP fit in compliance work?',
        a: 'A compliance platform exposed over MCP lets an AI assistant answer "what changed in our space this quarter" or "which obligations does this new rule touch" from live monitored data, in conversation. Listings note which tools ship MCP servers.',
      },
    ],
  },

  general: {
    headline: 'General-Purpose AI Tools for Legal Practice',
    intro: [
      'This category holds the tools that don’t fit one practice function because they span several: AI platforms with legal modes, assistants built to work across research, drafting, and analysis, and the infrastructure pieces — including MCP servers — that connect general AI assistants to legal-specific data and software.',
      'General tools trade depth for reach. A dedicated contract-review product will usually beat a general assistant at contract review; the general assistant wins on everything that happens between the specialized tools — and, connected over MCP to the right sources, it can borrow their depth on demand. For many small firms, one well-connected general assistant is the realistic starting point.',
    ],
    criteria: [
      'Connectivity over raw capability: a general assistant’s value scales with what it can reach. MCP support is the practical measure of that.',
      'Data terms at the platform level: general platforms have general data policies — confirm the tier you’re on has the retention and training terms you need for client work.',
      'Legal-specific behavior: platforms with explicit legal modes or configurations handle citations and confidentiality-sensitive prompts differently than raw consumer tiers. The difference is worth the setup time.',
      'Total cost against the specialist alternative: price a general platform plus connectors against the dedicated tool for your single heaviest use case before deciding which way to go.',
    ],
    faqs: [
      {
        q: 'Should my firm start with a general AI assistant or a specialized legal tool?',
        a: 'Start from your sharpest pain point. If one workflow dominates — contract review, intake, research — a specialized tool gets you further faster. If the pain is diffuse across drafting, summarizing, and answering questions, a general assistant with the right connections covers more ground per dollar. Many firms end up with one general assistant plus one or two specialists.',
      },
      {
        q: 'What is MCP and why does this directory care about it?',
        a: 'MCP — Model Context Protocol — is the open standard that lets AI assistants call external tools and data sources directly. It’s what turns a chatbot that talks about legal work into an assistant that queries dockets, searches case law, or files time entries. This directory catalogs which legal tools ship MCP servers, and runs its own: connect it and your assistant can search these listings directly.',
      },
      {
        q: 'Are consumer AI subscriptions safe to use for client work?',
        a: 'Consumer tiers and business tiers typically carry different data-retention and training terms — the same product name can mean two different privacy postures. Check the terms of the specific tier before client material touches it, and check your state bar’s guidance on AI use; that combination, not the product’s marketing, is the answer.',
      },
    ],
  },
}
