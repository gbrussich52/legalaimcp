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

export interface CategoryLink {
  href: string
  label: string
}

/**
 * A short section on a category page that points at listings by slug. Names and taglines come
 * from the database row at render time, so the page can never describe a tool the directory
 * does not currently publish (a slug that is not published is skipped, and an empty section is
 * not shown). `lead` must stay true of the topic in general, never of one tool's features.
 */
export interface CategoryFocus {
  heading: string
  lead: string
  slugs: string[]
}

export interface CategorySteps {
  heading: string
  intro: string
  items: string[]
}

export interface CategoryContent {
  /** Search-intent headline, used as the page h1 in place of the bare name. */
  headline: string
  /**
   * Claude Sonnet 5.5, 2026-11-12: optional H1 and <title> for the category page only. `headline`
   * still names the matching /best page and the "more rankings" pills, so a query-shaped
   * category headline does not rename the roundup. Keep it <= 47 chars so the brand fits.
   */
  searchHeadline?: string
  /** Claude Sonnet 5.5, 2026-11-12: 110-160 char meta description for the category page. */
  metaDescription?: string
  /**
   * Claude Sonnet 5.5, 2026-11-12: answer-first lead shown under the H1 in place of the bare
   * database sentence. Plain claims about the category only; no tool-specific facts.
   */
  answer?: string
  /** Claude Sonnet 5.5, 2026-11-12: listing-backed sections (see CategoryFocus). */
  focus?: CategoryFocus[]
  /** Claude Sonnet 5.5, 2026-11-12: numbered how-to-set-it-up section. */
  steps?: CategorySteps
  /** Claude Sonnet 5.5, 2026-11-12: internal links to guides and posts that exist in this repo. */
  links?: CategoryLink[]
  /** Claude Sonnet 5.5, 2026-11-12: answer-first lead for the /best roundup of this category. */
  bestLead?: string
  /** Claude Sonnet 5.5, 2026-11-12: one extra link shown under the /best lead. */
  bestAlso?: CategoryLink
  /** 2–3 paragraph buyer's-guide intro. Plain strings, rendered as <p>s. */
  intro: string[]
  /** "What to look for" bullets — software-evaluation criteria only. */
  criteria: string[]
  faqs: CategoryFaq[]
}

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  'document-processing': {
    headline: 'AI Document & Contract Tools for Law Firms',
    // Claude Sonnet 5.5, 2026-11-12: search-gap fields for this category (Search Console 2026-10-16 to 2026-11-13).
    links: [
      { href: '/blog/ai-contract-review-tools-compared', label: 'Compare Luminance, Ironclad and Kira for AI contract review' },
    ],
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
    // Claude Sonnet 5.5, 2026-11-12: search-gap fields for this category (Search Console 2026-10-16 to 2026-11-13).
    searchHeadline: 'AI Case & Matter Management for Lawyers',
    metaDescription: 'AI case and matter management tools for lawyers. Compare practice-management software with AI features and see which listings document an assistant connector.',
    answer: 'AI case management tools help a law firm track matters, deadlines and documents, with AI features such as summaries, drafting and suggested time entries. Start from your sharpest pain point, and check that a tool connects to the practice-management system you already use.',
    bestLead: 'Legal practice management software tracks matters, contacts, deadlines, time and billing. This list shows tools in that group in directory order. Some listings document a connector for an AI assistant, and each listing says what is documented and links the source. Clio documents a Claude connector for its separate Clio Work product; see the Clio listing.',
    links: [
      { href: '/servers/clio', label: 'Clio: AI features and connector options' },
      { href: '/guides/connect-claude-to-clio', label: 'Clio MCP: community setup reference' },
    ],
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
    // Claude Sonnet 5.5, 2026-11-12: search-gap fields for this category (Search Console 2026-10-16 to 2026-11-13).
    searchHeadline: 'AI Client Intake & Communication for Lawyers',
    metaDescription: 'AI client intake and communication tools for lawyers, with a step-by-step workflow for intake, follow-up and handoff to a person. Compare listings.',
    answer: 'AI client intake tools collect a new client’s details, answer routine questions and pass the matter to your team. The tools below cover intake conversations, document templates and call handling. A lawyer should stay in charge of every answer a client sees.',
    bestLead: 'These are the client intake and communication tools in our directory, in directory order. Check each listing for how it hands off to a person and where intake data goes.',
    steps: {
      heading: 'A practical AI client communication workflow',
      intro: 'Set it up in this order. Each step names who decides, so the AI never works alone.',
      items: [
        'Capture. A form, chat or call collects the client’s name, contact details and type of matter.',
        'Screen. Apply your own conflict and fit rules. The AI can flag a case. A person decides.',
        'Route. Send the intake into your case-management or CRM system so nobody retypes it.',
        'Follow up. Send reminders and status updates from templates your firm approved.',
        'Hand off. Define the moments when the AI stops and a lawyer takes over, such as any question about the merits of a case.',
        'Review. Read transcripts on a set schedule and fix what went wrong.',
      ],
    },
    links: [
      { href: '/workflow-plan', label: 'Plan one workflow before you buy' },
      { href: '/checklist', label: 'Free checklist: questions to ask before you adopt an AI tool' },
    ],
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
      // Claude Sonnet 5.5, 2026-11-12: extra answers for question-shaped gap queries.
      {
        q: 'How does AI client intake work for a law firm?',
        a: 'A chat, form or call handler asks a new client set questions, records the answers and sends them to your team or your case-management system. Good setups limit what the AI may say and hand off to a person at defined points. Test with made-up inquiries before real clients use it.',
      },
      {
        q: 'Which AI tools handle client intake for lawyers?',
        a: 'Compare the listings on this page. Each one shows what it covers, its pricing and any MCP server or reviewed connector details. Check the intake-to-system flow first, so intake data lands in the software you already use.',
      },
    ],
  },

  'legal-research': {
    headline: 'AI Legal Research Tools & Case Law Search',
    // Claude Sonnet 5.5, 2026-11-12: search-gap fields for this category (Search Console 2026-10-16 to 2026-11-13).
    searchHeadline: 'AI Case Law Research & Legal Citation Tools',
    metaDescription: 'Compare AI case law research and legal citation tools, from free CourtListener access to commercial platforms, and see which ones connect to your AI assistant.',
    answer: 'AI case law research tools search court opinions for you. The better ones link each answer to its source, so you can read the opinion before you cite it. The tools below run from free CourtListener access to commercial legal AI, and each listing shows its MCP details where the directory has them.',
    bestLead: 'These are the AI legal research tools in our directory, from free CourtListener access to commercial platforms. A listing with an MCP server or a documented connector can work with your AI assistant, and each listing says what is documented.',
    focus: [
      {
        heading: 'AI legal citation research',
        lead: 'Citation research checks that a case exists and says what your draft says it does. These listings work with citations. A citation check is a database lookup, not legal advice, so read the opinion before you file.',
        slugs: ['courtlistener-citations-checker', 'courtlistener-mcp'],
      },
      {
        heading: 'Free case law search with MCP',
        lead: 'CourtListener is run by the nonprofit Free Law Project, and its accounts are free for individuals. These listings connect an AI assistant to case law and other U.S. legal sources.',
        slugs: ['courtlistener-mcp', 'us-legal-mcp'],
      },
    ],
    links: [
      { href: '/guides/connect-claude-to-courtlistener', label: 'Connect Claude to CourtListener (setup guide)' },
      { href: '/blog/courtlistener-mcp-inside-claude', label: 'CourtListener in Claude: sources, access and research limits' },
      { href: '/guides/connect-claude-to-harvey', label: 'Connect Claude to Harvey AI (setup guide)' },
    ],
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
      // Claude Sonnet 5.5, 2026-11-12: extra answers for question-shaped gap queries.
      {
        q: 'How do I check AI legal citations?',
        a: 'Look up each case in a primary source, such as the court’s own site or a case-law database, and read the passage you rely on. Some MCP tools can run that lookup from your AI assistant. The CourtListener MCP server documents a citation tool that checks each case citation against the CourtListener database. Treat the result as a lookup, not a legal opinion.',
      },
      {
        q: 'Which AI tools search case law?',
        a: 'The tools listed on this page. They differ in coverage, price and MCP support. This directory lists links that passed an automated check first, then Featured listings, then names. That is not a performance ranking, so test two or three tools on questions where you already know the answer.',
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
    // Claude Sonnet 5.5, 2026-11-12: search-gap fields for this category (Search Console 2026-10-16 to 2026-11-13).
    metaDescription: 'AI compliance and regulatory monitoring tools for legal teams. See what each tool covers, from governance and policy to privacy scans, and whether it has MCP.',
    answer: 'These AI tools support compliance work in legal settings. They do different jobs, from governance, risk and policy programs to privacy scans and legal-data review, and not every tool here monitors regulations. Read each description before you buy, and ask for the list of sources a tool watches.',
    bestLead: 'These are the compliance tools in our directory, in directory order. Only a listing that shows an MCP repository or install details has a documented MCP server, so open each one to check what it covers.',
    focus: [
      {
        heading: 'Follow rulemaking and public comments',
        lead: 'If you need to follow rulemaking dockets rather than run a compliance program, start with this connector from the legal research category.',
        slugs: ['regulationsgov-mcp'],
      },
    ],
    links: [
      { href: '/blog/compliance-considerations-ai-law-firms', label: 'AI software due diligence for law firms: questions to resolve' },
      { href: '/checklist', label: 'Free checklist: questions to ask before you adopt an AI tool' },
    ],
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
      // Claude Sonnet 5.5, 2026-11-12: extra answers for question-shaped gap queries.
      {
        q: 'What should I ask before I buy AI compliance monitoring software?',
        a: 'Ask for the exact list of sources and jurisdictions the tool watches and how fast changes appear. Ask how it decides which changes apply to you, what record it keeps for audits, and where a person reviews its output.',
      },
      {
        q: 'Which compliance tools here support MCP?',
        a: 'Open each listing. A tool with an MCP server shows its repository or install details, and the connection panel says when MCP setup documentation has been reviewed. A tool without those has no confirmed MCP connection in this directory, though one may exist.',
      },
    ],
  },

  general: {
    headline: 'General-Purpose AI Tools for Legal Practice',
    // Claude Sonnet 5.5, 2026-11-12: search-gap fields for this category (Search Console 2026-10-16 to 2026-11-13).
    bestLead: 'These are the general-purpose AI tools in our directory, in directory order. If you are looking for legal practice management tools to use with Claude, see the case and matter management list.',
    bestAlso: { href: '/best/case-management-mcp-servers', label: 'Legal practice management tools with MCP' },
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
