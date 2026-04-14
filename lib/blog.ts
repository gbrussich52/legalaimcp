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
