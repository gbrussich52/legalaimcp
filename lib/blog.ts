/**
 * Blog system — file-based articles stored as TypeScript objects.
 * Simple, no MDX compilation needed, no additional dependencies.
 */

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  author: string
  category: string
  readingTime: string
  content: string // HTML content
}

const posts: BlogPost[] = [
  {
    slug: 'courtlistener-mcp-inside-claude',
    title: 'CourtListener Is Now Inside Claude — What It Means for Litigators',
    description:
      'Free Law Project\'s CourtListener MCP connector gives AI agents native access to case law, PACER data, and oral argument transcripts. Here\'s what changes for litigators.',
    date: '2026-05-14',
    author: 'LegalAIMCP Team',
    category: 'News',
    readingTime: '5 min read',
    content: `
<p>On May 12, 2026, the Free Law Project announced that <strong>CourtListener is now available as an MCP connector inside Claude</strong> — giving AI assistants native, real-time access to one of the most comprehensive legal databases in the country. This is a significant moment for litigators who've been manually bouncing between research platforms and their AI tools.</p>

<h2>What CourtListener Gives You</h2>
<p>CourtListener isn't a lightweight database. Through the MCP connector, AI assistants can now directly access:</p>
<ul>
<li><strong>Federal and state case law</strong> — millions of opinions across all circuits</li>
<li><strong>PACER data</strong> — real court docket information without the manual login</li>
<li><strong>Citation analysis</strong> — see how cases have been cited, distinguished, or overruled</li>
<li><strong>Oral argument transcripts</strong> — understand how courts have engaged with specific arguments</li>
<li><strong>Judge data</strong> — judicial history and appointment records</li>
<li><strong>Real-time alerts</strong> — set up monitoring for new opinions on specific topics</li>
</ul>
<p>All of this is accessible in plain English, directly from your AI assistant, without switching applications or manually querying a search interface.</p>

<h2>What Actually Changes for Litigators</h2>
<p>Before this integration, a typical research workflow looked like: query Westlaw or Lexis, copy the relevant case text, paste it into your AI tool, get analysis, then go back to verify citations. The CourtListener connector collapses this into a single conversation.</p>
<p>You can ask Claude to find the three most relevant circuit court opinions on a damages issue in securities cases, get a summary of how each court reasoned, identify which circuits have split, and then draft a memo framing your argument around the majority approach — all in one session, with citations that are real.</p>
<p><strong>The hallucination problem becomes less acute.</strong> When your AI assistant is pulling from a live legal database rather than generating from training data, fabricated citations become a much smaller risk. That alone is significant.</p>

<h2>The Catch: It's Free Law, Not Westlaw</h2>
<p>CourtListener is excellent for federal court opinions and increasingly strong on state courts, but it isn't a substitute for Westlaw's editorial layer — KeyCite, headnotes, secondary sources, and practice guides. For primary source research on federal questions, it's now a serious option. For comprehensive state court research or secondary source access, you still need a commercial subscription.</p>

<h2>How to Use It</h2>
<p>The CourtListener MCP connector works with Claude Desktop and Claude Code. If you're already using Claude as your primary AI tool, you can add the connector through the MCP settings. The Free Law Project has published setup documentation on their site.</p>
<p>This is the kind of integration that demonstrates what the MCP ecosystem can become for legal practice — specialized, reliable, and genuinely useful rather than a demo. Expect more of these in 2026.</p>
`,
  },
  {
    slug: 'general-legal-mcp-server-first-law-firm',
    title: 'General Legal\'s MCP Server: The First Law Firm Built for AI Agents',
    description:
      'General Legal shipped the first production MCP server designed for AI agents to use as clients — uploading contracts for attorney review and getting back redlines. Here\'s how it works and what it signals for the industry.',
    date: '2026-05-16',
    author: 'LegalAIMCP Team',
    category: 'Analysis',
    readingTime: '6 min read',
    content: `
<p>In April 2026, General Legal quietly shipped something that nobody else in the legal industry has done: a production MCP server that allows AI agents to be <em>clients</em> of a law firm. Not a tool for lawyers — a tool that lets AI workflows hire lawyers.</p>
<p>It's a small but meaningful inversion that says a lot about where legal services are heading.</p>

<h2>What General Legal Built</h2>
<p>The General Legal MCP server exposes four tools:</p>
<ul>
<li><strong>upload_contract</strong> — Submit a contract for attorney review</li>
<li><strong>confirm_upload</strong> — Verify the submission was received</li>
<li><strong>list_contracts</strong> — Check the status of pending reviews</li>
<li><strong>download_contract</strong> — Retrieve the attorney-redlined version</li>
</ul>
<p>The workflow is entirely conversational. An AI agent running inside Claude Code or Claude Desktop can upload a contract, monitor its status, and download the completed attorney review — all without a human manually logging into a portal or emailing attachments.</p>

<h2>Why This Is Different</h2>
<p>The key distinction is professional liability. General Legal isn't selling AI-generated redlines dressed up with a law firm name. Licensed attorneys review every contract. The MCP server is the intake and delivery mechanism — the human judgment is still in the loop, just accessed differently.</p>
<p>Their pricing reflects this: $250 for contracts under three pages, $500 for standard contracts, $10/page for longer documents, and $2,000 for contract drafting. Turnaround is typically a few hours.</p>
<p>This is fundamentally different from AI tools that generate redlines and hope you review them carefully. It's a law firm that happens to accept work from AI agents as clients.</p>

<h2>The Broader Implication</h2>
<p>Legal services are increasingly being consumed by software systems, not just humans. As AI-powered business automation grows, there will be more situations where an AI agent needs to complete a legal task — review a vendor contract, check compliance, flag an issue — as part of a larger automated workflow.</p>
<p>General Legal's model is one answer to that: a law firm designed from the ground up to serve AI agents as clients, with the professional accountability that human lawyers bring.</p>
<p>Other law firms should be paying attention. The clients who come to you in 2028 may not always be humans.</p>

<h2>What It Means for Your Firm</h2>
<p>If you run a firm that handles commodity contract review — NDAs, standard vendor agreements, boilerplate leases — the competitive pressure is now explicit. AI agents can now access attorney review programmatically, at scale, at flat-fee pricing.</p>
<p>The winning position isn't to compete on volume and price. It's to build expertise and relationships that AI workflows can't replicate. But understanding what's happening in the MCP ecosystem is a prerequisite for making that strategic shift with your eyes open.</p>
`,
  },
  {
    slug: 'anthropic-enters-legal-ai-what-it-means',
    title: 'Anthropic Enters Legal AI: What It Means for Your Firm',
    description:
      'Anthropic is partnering with legal AI platforms to automate specific firm workflows. Here\'s what the $4B company\'s move into legal means for lawyers evaluating AI tools in 2026.',
    date: '2026-05-20',
    author: 'LegalAIMCP Team',
    category: 'Analysis',
    readingTime: '5 min read',
    content: `
<p>In May 2026, TechCrunch reported that Anthropic — the company behind Claude — is actively partnering with legal AI platforms to automate specific clerical functions at law firms. For an industry that's been cautiously evaluating AI for years, this represents a meaningful shift in how seriously the major AI players are treating legal as a vertical.</p>

<h2>What Anthropic Is Actually Building</h2>
<p>The company's legal AI push targets specific high-volume, low-judgment workflows:</p>
<ul>
<li><strong>Document search and review</strong> — finding relevant documents across large case files</li>
<li><strong>Case law research</strong> — identifying relevant precedents and summarizing holdings</li>
<li><strong>Deposition prep</strong> — organizing deposition transcripts and flagging key testimony</li>
<li><strong>Document drafting</strong> — generating first drafts of standard documents from templates</li>
</ul>
<p>The focus on "clerical functions" is deliberate. Anthropic isn't positioning Claude as a lawyer — it's positioning Claude as a paralegal that never sleeps and never makes typos.</p>

<h2>Why This Matters More Than It Seems</h2>
<p>When a company with $4 billion in funding and backing from Google and Amazon decides that legal is a priority vertical, it changes the investment calculus for the entire legal AI ecosystem. More capital flows in. More specialized tools get built. The underlying model capabilities improve faster because legal use cases drive training data and fine-tuning.</p>
<p>The firms that are figuring out AI workflows <em>now</em> will have a significant advantage when these tools mature. Not because they'll have locked in some specific platform, but because they'll have the organizational knowledge of how to integrate AI into legal work — which is genuinely hard to develop quickly.</p>

<h2>The MCP Connection</h2>
<p>Anthropic's involvement also accelerates the MCP ecosystem. Claude is already the most MCP-capable AI assistant in widespread use, and as Anthropic pushes deeper into legal verticals, expect more legal-specific MCP connectors — for case management systems, document stores, court filing platforms, and billing tools.</p>
<p>CourtListener's May 2026 MCP connector is an early example of this. Expect more.</p>

<h2>What To Do Right Now</h2>
<p>You don't need to wait for Anthropic's formal legal product launch. The tools are good enough today to meaningfully change how you work on document-heavy tasks. The practical steps:</p>
<ol>
<li><strong>Identify your highest-volume repetitive tasks</strong> — document review, research, first-draft generation</li>
<li><strong>Run a 30-day trial</strong> using Claude or another AI assistant on just one of those tasks</li>
<li><strong>Measure the time savings</strong> and document what had to be reviewed or corrected</li>
<li><strong>Browse the MCP directory</strong> to see if there's an integration that connects your AI to the specific data source you need</li>
</ol>
<p>The firms that are waiting for AI to be "ready" are already behind. The question now is how far behind — and whether the gap is still closeable.</p>
`,
  },
  {
    slug: 'what-is-mcp-for-law-firms',
    title: 'What Is MCP and Why Should Your Law Firm Care?',
    description:
      'Model Context Protocol is changing how AI connects to legal software. Here\'s what it means for your practice.',
    date: '2026-04-10',
    author: 'LegalAIMCP Team',
    category: 'Guide',
    readingTime: '5 min read',
    content: `
<p>If you've been following AI developments in the legal industry, you've likely heard the term <strong>MCP</strong> — Model Context Protocol. But what is it, and why does it matter for your firm?</p>

<h2>The Problem MCP Solves</h2>
<p>Today, most AI tools for lawyers work in isolation. You paste text into ChatGPT, get a response, then manually move that response into your case management system. Your AI assistant can't see your calendar, your document management system, or your billing records unless you copy-paste everything in.</p>
<p>This is like having a brilliant paralegal who sits in a locked room with no phone, no computer, and no access to your filing cabinets. They can only work on whatever papers you slide under the door.</p>
<p><strong>MCP changes this.</strong></p>

<h2>How MCP Works</h2>
<p>Model Context Protocol is an open standard (created by Anthropic) that defines how AI assistants connect to external tools and data sources. Think of it as a universal adapter — like USB-C for AI.</p>
<p>With MCP, an AI assistant can:</p>
<ul>
<li>Read your case files directly from your document management system</li>
<li>Search your firm's internal knowledge base for relevant precedents</li>
<li>Check your billing records to answer client questions about invoices</li>
<li>Pull court docket information in real time</li>
<li>Access your CRM to understand client history before a meeting</li>
</ul>
<p>All of this happens through secure, permission-controlled connections. The AI only accesses what you explicitly authorize.</p>

<h2>What This Means for Your Practice</h2>
<p>The practical implications are significant:</p>
<p><strong>Faster research:</strong> Instead of manually searching Westlaw, your AI assistant searches your internal brief bank alongside external sources — simultaneously.</p>
<p><strong>Better client service:</strong> Before a client call, your AI can summarize the entire case file, flag upcoming deadlines, and suggest discussion points — without you lifting a finger.</p>
<p><strong>Reduced data entry:</strong> When AI can read and write to your systems directly, you eliminate the copy-paste workflow that eats hours every week.</p>

<h2>Getting Started</h2>
<p>The MCP ecosystem is still young, which means the firms that adopt early will have a meaningful advantage. Start by:</p>
<ol>
<li><strong>Browsing our directory</strong> to see what MCP integrations exist for your practice areas</li>
<li><strong>Identifying one workflow</strong> that involves heavy copy-paste between AI and your tools</li>
<li><strong>Testing a free integration</strong> to see the difference firsthand</li>
</ol>
<p>The firms that figure out MCP now will be the ones setting the pace in 2027 and beyond.</p>
`,
  },
  {
    slug: 'ai-contract-review-tools-compared',
    title: '5 AI Contract Review Tools Compared: Which One Fits Your Firm?',
    description:
      'A practical comparison of Luminance, Ironclad, Kira Systems, and other AI contract review platforms for legal teams.',
    date: '2026-04-08',
    author: 'LegalAIMCP Team',
    category: 'Comparison',
    readingTime: '7 min read',
    content: `
<p>AI-powered contract review is one of the most mature categories in legal tech. But with multiple strong options on the market, choosing the right tool can be overwhelming. Here's a practical breakdown.</p>

<h2>The Landscape</h2>
<p>Contract review AI falls into two broad camps: <strong>standalone platforms</strong> (purpose-built for contract analysis) and <strong>features within larger suites</strong> (like Clio's AI or Westlaw's CoCounsel). We're focusing on the standalone tools here.</p>

<h2>Luminance</h2>
<p><strong>Best for:</strong> Large firms and corporate legal departments handling high-volume due diligence.</p>
<p>Luminance uses proprietary legal-specific LLMs (not just fine-tuned general models) trained on billions of legal documents. The standout feature is AI negotiation — Luminance can actually draft and propose redlines based on your firm's playbook. Supports 80+ languages, which makes it the clear choice for cross-border transactions.</p>
<p><strong>Pricing:</strong> Enterprise only. Expect $50K+ annually for a mid-size deployment.</p>

<h2>Ironclad</h2>
<p><strong>Best for:</strong> In-house legal teams managing the full contract lifecycle.</p>
<p>Ironclad is less about deep clause-level analysis and more about workflow automation. Their AI drafts contracts from templates, routes them for approval, tracks negotiations, and manages execution. The Salesforce integration is particularly strong for commercial contracts tied to deals. If your bottleneck is contract turnaround time rather than review depth, Ironclad is likely the better fit.</p>
<p><strong>Pricing:</strong> Starts around $5,000/year for small teams.</p>

<h2>Kira Systems (Litera)</h2>
<p><strong>Best for:</strong> Firms that need highly customizable extraction models.</p>
<p>Kira's strength is its machine learning approach to clause extraction. The platform ships with 100+ pre-built extraction models, but the real power is training custom models on your firm's specific clause libraries. This makes it ideal for firms with specialized practice areas or non-standard contract types. Widely used for lease abstraction and M&A due diligence.</p>
<p><strong>Pricing:</strong> Volume-based enterprise pricing.</p>

<h2>How to Choose</h2>
<p>Ask yourself three questions:</p>
<ol>
<li><strong>Volume:</strong> Are you reviewing hundreds of contracts per month, or dozens?</li>
<li><strong>Workflow:</strong> Do you need just review, or the full lifecycle (draft → negotiate → sign → manage)?</li>
<li><strong>Customization:</strong> Do your contracts follow standard patterns, or are they highly specialized?</li>
</ol>
<p>High volume + review focus → <strong>Luminance</strong>. Full lifecycle → <strong>Ironclad</strong>. Custom extraction → <strong>Kira Systems</strong>.</p>
<p>For smaller firms just getting started with AI contract review, consider starting with a general-purpose AI like Claude, which can handle contract analysis through its long context window without the enterprise price tag.</p>
`,
  },
  {
    slug: 'compliance-considerations-ai-law-firms',
    title: 'Compliance Considerations When Adopting AI in Your Law Practice',
    description:
      'Ethical obligations, data security, and bar association guidance on using AI tools in legal work.',
    date: '2026-04-05',
    author: 'LegalAIMCP Team',
    category: 'Compliance',
    readingTime: '6 min read',
    content: `
<p>AI tools can dramatically improve efficiency, but they also introduce new compliance obligations. Before deploying AI in your practice, understand the regulatory and ethical landscape.</p>

<h2>Bar Association Guidance</h2>
<p>As of 2026, over 30 state bars have issued guidance or formal opinions on AI use in legal practice. The common themes:</p>
<ul>
<li><strong>Competence:</strong> Lawyers have a duty to understand the technology they use (ABA Model Rule 1.1, Comment 8). You don't need to be a technologist, but you must understand AI's limitations — including hallucination risks.</li>
<li><strong>Supervision:</strong> AI output must be reviewed by a licensed attorney before it reaches clients or courts. AI is a tool, not a practitioner.</li>
<li><strong>Confidentiality:</strong> Client data sent to AI services must be protected (ABA Model Rule 1.6). This means understanding where your data goes and how it's stored.</li>
<li><strong>Candor:</strong> Several courts now require disclosure when AI was used in filings. Check your jurisdiction's local rules.</li>
</ul>

<h2>Data Security Checklist</h2>
<p>Before adopting any AI tool, verify:</p>
<ol>
<li><strong>Data residency:</strong> Where is client data processed and stored? Some jurisdictions restrict cross-border data transfers.</li>
<li><strong>Retention policies:</strong> Does the AI provider retain your prompts or client data? For how long? Can you opt out of training data use?</li>
<li><strong>Encryption:</strong> Is data encrypted in transit (TLS 1.2+) and at rest?</li>
<li><strong>SOC 2 / ISO 27001:</strong> Has the vendor been independently audited?</li>
<li><strong>BAA availability:</strong> If handling health-related legal matters, does the vendor offer a Business Associate Agreement?</li>
</ol>

<h2>MCP and Data Security</h2>
<p>One advantage of MCP-based integrations is that data stays closer to home. Unlike cloud AI tools where you upload documents to a third-party server, MCP allows AI assistants to <em>read</em> your systems through secure, controlled connections. The data doesn't leave your infrastructure — the AI comes to the data, rather than the data going to the AI.</p>
<p>This doesn't eliminate all security considerations, but it significantly reduces data exposure compared to the copy-paste-into-ChatGPT workflow many attorneys currently use.</p>

<h2>Practical Steps</h2>
<ol>
<li><strong>Create an AI use policy</strong> for your firm, even if you're a solo practitioner.</li>
<li><strong>Vet every tool</strong> against the data security checklist above before onboarding.</li>
<li><strong>Document your process</strong> — if a bar disciplinary committee ever asks, you want to show that you evaluated AI tools with the same rigor you'd apply to any other vendor.</li>
<li><strong>Stay current</strong> — bar guidance on AI is evolving rapidly. Subscribe to your state bar's ethics opinions.</li>
</ol>
<p>The firms that approach AI adoption thoughtfully — balancing efficiency gains with compliance obligations — will be the ones that benefit most in the long run.</p>
`,
  },
]

export function getAllPosts(): BlogPost[] {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug)
}
