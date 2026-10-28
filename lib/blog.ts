/**
 * Blog system — file-based articles stored as TypeScript objects.
 * Simple, no MDX compilation needed, no additional dependencies.
 */

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  updatedDate?: string
  author: string
  category: string
  readingTime: string
  content: string // HTML content
}

const posts: BlogPost[] = [
  {
    "slug": "courtlistener-mcp-inside-claude",
    "title": "CourtListener in Claude: Sources, Access and Research Limits",
    "description": "What Free Law Project documents, how authorization works, and what researchers still need to verify.",
    "date": "2026-05-14",
    "category": "News",
    "content": "<p>Free Law Project announced its CourtListener connector on May 12, 2026. Its documentation describes research tools for opinions, dockets, citation relationships, judges, oral arguments and alerts. Availability depends on source coverage, account authorization and current service limits.</p><h2>Retrieval and interpretation are separate checks</h2><p>A connector can supply source material to an assistant. It does not establish that a generated quotation, legal proposition or treatment of a case is correct. A citation relationship is not a comprehensive editorial determination that a case was distinguished or overruled. Open the original records and check the proposition being used.</p><h2>Check access before using it</h2><p>Interactive clients use CourtListener authorization; other clients may use documented API-token authentication. Available RECAP materials and separate PACER access are different, and fees or account limits may apply. Some tools change alert settings or request documents. We reviewed public documentation; we did not connect a customer account or benchmark legal output.</p><p>Sources: <a href=\"https://free.law/2026/05/12/courtlistener-is-now-available-inside-claude/\">Free Law Project announcement</a> and <a href=\"https://github.com/freelawproject/courtlistener-api-client/blob/main/MCP_README.md\">official setup and tool documentation</a>. <a href=\"/guides/connect-claude-to-courtlistener\">Read our setup reference</a>.</p>",
    "updatedDate": "2026-10-27",
    "author": "LegalAIMCP Team",
    "readingTime": "2 min read"
  },
  {
    "slug": "general-legal-mcp-server-first-law-firm",
    "title": "General Legal’s MCP Service: Check the Engagement and Workflow",
    "description": "A documented attorney-service interface, with account, engagement and review boundaries to confirm.",
    "date": "2026-05-16",
    "category": "Analysis",
    "content": "<p>General Legal documents a service through which an authorized AI-assisted workflow can open matters, submit contract documents, exchange messages and retrieve reviewed work. Its current maintainer documentation describes authentication and account setup. This is a specific service interface, not proof that an autonomous agent can act as a legal client without authorization.</p><h2>Confirm the service before sending a document</h2><p>Check the engagement terms, responsible person, supported work, confidentiality arrangements, current fees and availability directly with the firm. A published integration does not establish a turnaround time, guaranteed result or allocation of liability for your matter.</p><p>Review which actions send documents, create matters or change records. Keep approval with the authorized person and use permitted fictional examples for initial evaluation. LegalAIMCP has reviewed public documentation; we have not opened a matter, retained an attorney through the connector or tested legal work.</p><p>Sources: <a href=\"https://github.com/General-Legal/general-legal-mcp\">maintainer repository</a> and <a href=\"https://go.general.legal/\">General Legal’s service page</a>. Use the current documentation rather than an old tool count or installer copied from an announcement.</p>",
    "updatedDate": "2026-10-27",
    "author": "LegalAIMCP Team",
    "readingTime": "2 min read"
  },
  {
    "slug": "anthropic-enters-legal-ai-what-it-means",
    "title": "Claude for Legal Work: Connectors, Plugins and Review",
    "description": "What Anthropic’s legal offering documents and how to evaluate it for one permitted workflow.",
    "date": "2026-05-20",
    "category": "News",
    "content": "<p>Anthropic announced an expanded legal offering on May 12, 2026, combining connectors to existing software with practice-area workflow plugins. A connector supplies context or tools; a plugin packages instructions for a task. Neither supplies an organization’s software entitlements or authority to disclose client information.</p><h2>Evaluate one workflow</h2><p>Choose a permitted task, identify the source records it needs, check account and administrator requirements, and define what an acceptable output must contain. Test with fictional or otherwise permitted material. Check quotations, citations, missing information and consequential actions separately.</p><p>Anthropic’s reference materials frame legal outputs as drafts for professional verification. Product documentation and a vendor’s discussion of privilege are not a determination of the obligations that apply to a particular firm or matter. We have not tested a customer account or measured a productivity improvement.</p><p>Sources: <a href=\"https://claude.com/resources/articles/claude-for-the-legal-industry\">Anthropic’s announcement</a> and <a href=\"https://github.com/anthropics/claude-for-legal\">official reference repository</a>. <a href=\"/servers\">Compare documented tools and their access requirements</a>.</p>",
    "updatedDate": "2026-10-27",
    "author": "LegalAIMCP Team",
    "readingTime": "2 min read"
  },
  {
    "slug": "what-is-mcp-for-law-firms",
    "title": "What MCP Connects—and What Each Connector Must Prove",
    "description": "Understand tools, permissions and data flows before connecting firm systems to an AI application.",
    "date": "2026-04-10",
    "category": "Guide",
    "content": "<p>Model Context Protocol is an open client/server protocol for exchanging context and exposing tools to compatible AI applications. A document connector may expose search; a billing connector may expose reads, writes or both. The available functions and requirements come from that implementation, not from the protocol name.</p><h2>Map the data path</h2><p>A server may run locally or remotely. Even a local server can return information to a hosted AI application or inference provider. MCP does not by itself keep data local or establish that a connection is safe. Review the server, upstream services, AI provider, authentication, enabled tools, retention and logging.</p><h2>Start with a verifiable task</h2><p>Choose one permitted operation and define its source, expected result and failure behavior. Try a fictional example, check returned source records and retain approval for consequential actions. Check native product features as well as MCP options. A working connection is separate from a correct output or an appropriate use of customer data.</p><p>Sources: <a href=\"https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture\">official MCP architecture</a> and <a href=\"https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices\">security guidance</a>. <a href=\"/mcp\">Our directory MCP returns software listings; it does not connect your firm’s private systems</a>.</p>",
    "updatedDate": "2026-10-27",
    "author": "LegalAIMCP Team",
    "readingTime": "2 min read"
  },
  {
    "slug": "ai-contract-review-tools-compared",
    "title": "Three Contract-Review Platforms: Compare the Workflow",
    "description": "Compare documented Luminance, Ironclad and Kira workflows using the same permitted sample and current vendor terms.",
    "date": "2026-04-08",
    "category": "Comparison",
    "content": "<p>Luminance, Ironclad and Kira describe overlapping contract workflows. We reviewed their public documentation; we have not run a comparative customer-account benchmark. There is no source-backed price comparison in this article. Obtain current quotes and confirm the features and deployment included.</p><h2>What the vendors describe</h2><ul><li><a href=\"https://www.luminance.com/\">Luminance</a>: negotiation using playbooks and precedent, portfolio questions and connected contract workflows.</li><li><a href=\"https://ironcladapp.com/\">Ironclad</a>: contract lifecycle management and connected workflows. Its documented MCP search and obligation tools have distinct access requirements.</li><li><a href=\"https://www.litera.com/capabilities/review\">Kira by Litera</a>: extracting contract provisions, pre-built or custom fields and collaborative review.</li></ul><h2>Run a fair evaluation</h2><p>Use the same permitted sample documents and check extraction accuracy, traceability to source text, review controls, collaboration, integrations and exports. Record missing information and corrections, not only successful demonstrations. Confirm account permissions, data handling and commercial terms before choosing. A vendor description does not establish how a product performs on your documents.</p><p><a href=\"/categories/document-processing\">See the directory’s document-processing tools and source references</a>.</p>",
    "updatedDate": "2026-10-27",
    "author": "LegalAIMCP Team",
    "readingTime": "2 min read"
  },
  {
    "slug": "compliance-considerations-ai-law-firms",
    "title": "AI Software Due Diligence for Law Firms: Questions to Resolve",
    "description": "Review data flows, access, source quality and human approval without treating a connector or certificate as proof of compliance.",
    "date": "2026-04-05",
    "category": "Guide",
    "content": "<p>This is a software due-diligence guide, not a determination of legal obligations. ABA Formal Opinion 512 discusses professional-responsibility questions raised by generative AI. Qualified counsel should check the rules, orders and circumstances applicable to the matter and jurisdiction.</p><h2>Document the proposed use</h2><ul><li>Which records enter the workflow, and who is authorized to disclose them?</li><li>Which server, upstream services and AI provider receive the information?</li><li>What are the retention, training, logging and deletion terms for the selected account?</li><li>Which tools read or change records, and which actions need approval?</li><li>Who verifies source material, citations, missing information and the final output?</li></ul><h2>A protocol is not a privacy guarantee</h2><p>MCP does not guarantee that data remains inside your infrastructure. A local connector can return material to a hosted client or model. Audit certificates, encryption claims and connector documentation are evidence to examine within their actual scope; they do not establish that a particular use meets professional requirements.</p><p>Sources: <a href=\"https://www.americanbar.org/news/abanews/aba-news-archives/2024/07/aba-issues-first-ethics-guidance-ai-tools/\">ABA’s official explanation of Opinion 512</a> and <a href=\"https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture\">MCP architecture</a>. This page does not claim to survey every current state-bar opinion or court order.</p>",
    "updatedDate": "2026-10-27",
    "author": "LegalAIMCP Team",
    "readingTime": "2 min read"
  }
]

export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug)
}
