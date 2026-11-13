// classification: PUBLIC
// Claude Sonnet 5.5, 2026-11-12: optional page copy for search-gap queries. Every string in `lead`,
// `faqs` and `vendorConnector` below was checked against the cited vendor page on 2026-11-12.
// These fields feed the listing page only; the MCP result mapper (lib/mcp-results.ts) ignores them.
export interface ConnectionFaq {
  q: string
  a: string
}

/** A separate, vendor-documented connector for the same company (a different product from the listing). */
export interface VendorConnector {
  name: string
  summary: string
  requirements: string
  permissions: string
  source: string
  sourceLabel: string
  reviewed: string
}

/** Manually reviewed primary-source setup evidence, not a live compatibility test. */
export interface SoftwareConnection {
  slugs: readonly string[]
  name: string
  kind: 'official' | 'community'
  workflow: string
  requirements: string
  permissions: string
  setup: string
  source: string
  sourceLabel: string
  reviewed: string
  /** Heading wording for "courtlistener mcp server" style queries; defaults to `name`. */
  serverName?: string
  /** Answer-first paragraph for the listing page (about 50 words). */
  lead?: string
  faqs?: readonly ConnectionFaq[]
  /** Sources the FAQ answers were checked against, with the check date. */
  faqSources?: readonly { label: string; url: string }[]
  faqsChecked?: string
  vendorConnector?: VendorConnector
}

export const SOFTWARE_CONNECTIONS: readonly SoftwareConnection[] = [
  {
    slugs: ['imanage-work'],
    name: 'iManage Work',
    kind: 'official',
    workflow: 'Find and work with governed document and email content through iManage connectors.',
    requirements: 'An eligible iManage Work account, with the iManage MCP Control Center Extension and iManage MCP Service applications added in iManage Control Center. Team and Enterprise Claude organizations may require an administrator to enable the connector.',
    permissions: 'The vendor documents read permissions by default. Available tools depend on administrator configuration; review the authorization screen before granting access.',
    setup: 'In Claude connector settings, search for iManage Work, connect, and sign in with your iManage account. Custom connector URLs depend on the connector and any company subdomain; use the vendor instructions rather than guessing a tenant URL.',
    source: 'https://docs.imanage.com/ai/mcpserver-user-help/en-US/Adding_MCP_connectors_for_Claude.html',
    sourceLabel: 'iManage connector documentation',
    reviewed: '2026-10-28',
  },
  {
    slugs: ['courtlistener-mcp'],
    name: 'CourtListener',
    kind: 'official',
    workflow: 'U.S. opinions, dockets, judges, oral arguments and citation tools.',
    requirements: 'A CourtListener account and an MCP client that supports Streamable HTTP and OAuth.',
    permissions: 'The server also exposes alert management and broader API access. Review requested scopes; do not assume every tool is read-only.',
    setup: 'Add https://mcp.courtlistener.com/ as a remote connector, then sign in through CourtListener. The hosted OAuth setup does not need a separate API token; the maintainer also documents token-based clients.',
    source: 'https://github.com/freelawproject/courtlistener-api-client/blob/main/MCP_README.md',
    sourceLabel: 'Free Law Project setup documentation',
    reviewed: '2026-10-27',
    // Claude Sonnet 5.5, 2026-11-12: "courtlistener mcp" / "court listener mcp" / "courtlistener mcp server" sit at
    // positions 7.6 to 8.8 with 0 clicks. Source for the lead and FAQs below: the maintainer README, fetched
    // 2026-11-12, https://raw.githubusercontent.com/freelawproject/courtlistener-api-client/main/MCP_README.md
    // ("hosted by Free Law Project, the nonprofit behind CourtListener"; "Accounts are free for individuals";
    // "You do not need a separate API token to use the hosted server"; the Claude.ai / Claude Desktop connector
    // steps; `claude mcp add --transport http courtlistener https://mcp.courtlistener.com/`; the analyze_citations
    // tool "verify each unique case citation against the CourtListener database ... good, bad, ambiguous";
    // create_search_alert / subscribe_to_docket_alert "modify your CourtListener account state").
    serverName: 'the CourtListener MCP server',
    lead: 'The CourtListener MCP server is the official Model Context Protocol server hosted by Free Law Project, the nonprofit behind CourtListener. It lets an AI assistant such as Claude search U.S. case law, dockets, judges and oral arguments and check legal citations, using a free CourtListener account.',
    faqs: [
      {
        q: 'What is the CourtListener MCP server?',
        a: 'It is the official Model Context Protocol server for CourtListener, hosted by Free Law Project. It gives an MCP client such as Claude.ai, Claude Desktop, Claude Code or Cursor access to U.S. case law, dockets, judges, oral arguments, citation tools and alerts.',
      },
      {
        q: 'Is the CourtListener MCP server free?',
        a: 'The maintainer says CourtListener accounts are free for individuals, and the hosted server does not need a separate API token. You sign in with your CourtListener account. Usage limits and other charges depend on your account, so check the current terms. The server has a tool that reports your API usage and rate limits.',
      },
      {
        q: 'How do I connect the CourtListener MCP server to Claude?',
        a: 'In Claude.ai or Claude Desktop, open Settings, then Connectors, and choose Add custom connector. Enter the name CourtListener and the URL https://mcp.courtlistener.com/, then connect and sign in to your CourtListener account. In Claude Code, run: claude mcp add --transport http courtlistener https://mcp.courtlistener.com/',
      },
      {
        q: 'Can the CourtListener MCP server check legal citations?',
        a: 'Yes. The documentation describes a tool that pulls citations out of text and checks each unique case citation against the CourtListener database. It returns the case name, court, date and a status of good, bad or ambiguous. That is a database lookup. It does not replace reading the opinion, so check every case before you file.',
      },
      {
        q: 'Can the CourtListener MCP server change my account?',
        a: 'Some tools can. The documentation lists tools that create and delete search alerts and subscribe to or unsubscribe from docket alerts. Your client should ask you to confirm them. Review the permissions on the authorization screen before you approve.',
      },
    ],
    faqSources: [{ label: 'Free Law Project MCP README', url: 'https://github.com/freelawproject/courtlistener-api-client/blob/main/MCP_README.md' }],
    faqsChecked: '2026-11-12',
  },
  {
    slugs: ['harvey-mcp', 'harvey-ai'],
    name: 'Harvey',
    kind: 'official',
    workflow: 'Questions, Vault analysis and research over sources available to your Harvey account.',
    requirements: 'A Harvey account with MCP access; Streamable HTTP and OAuth support in the client.',
    permissions: 'Workspace permissions control available projects and tools. Data passed to another AI provider is subject to your agreements with that provider.',
    setup: 'In Claude connector settings, find Harvey, connect and authenticate. Ask your Harvey administrator if MCP is not enabled for your account.',
    source: 'https://developers.harvey.ai/guides/harvey_mcp',
    sourceLabel: 'Harvey developer documentation',
    reviewed: '2026-10-27',
  },
  {
    slugs: ['ironclad'],
    name: 'Ironclad',
    kind: 'official',
    workflow: 'Permission-aware contract search and, with the required add-on, obligation management.',
    requirements: 'An Ironclad account with the API and Search features and an OAuth-capable HTTP MCP client.',
    permissions: 'Conversational search is read-only. Obligation tools can create and update records and require the Obligations add-on; approve only the scopes you need.',
    setup: 'Choose the server for your environment: https://mcp.na1.ironcladapp.com/mcp (NA1) or https://mcp.eu1.ironcladapp.com/mcp (EU1). Add it to your client and authenticate with Ironclad.',
    source: 'https://support.ironcladapp.com/hc/en-us/articles/39887632957463-Connect-an-MCP-Client-to-Ironclad-MCP-Server',
    sourceLabel: 'Ironclad connection instructions',
    reviewed: '2026-10-27',
  },
  {
    slugs: ['clio', 'clio-matter-manager'],
    name: 'Clio',
    kind: 'community',
    workflow: 'The CHLEGAL community implementation exposes Clio matter, contact, time, task, calendar and billing tools.',
    requirements: 'Your own Clio access and the application credentials and runtime specified by the maintainer.',
    permissions: 'This community implementation includes write actions and requires configured Clio developer access. Inspect its code, permissions and maintenance before connecting firm data; no independent runtime security test has been performed.',
    setup: 'Use the maintainer README and our existing Clio guide. This is a community implementation, not a claim of an official Clio MCP connector or a tested integration.',
    source: 'https://github.com/CHLEGAL/clio-mcp-server',
    sourceLabel: 'Community maintainer repository',
    reviewed: '2026-10-27',
    // Claude Sonnet 5.5, 2026-11-12: "clio mcp server" 14.7, "clio ai" 15.5, "clio aila" 26.7. On 2026-11-12 Clio's own
    // help center (updated 2026-10-29) documents an official "Clio for Claude" connector on its Clio Work product:
    // https://help.clio.com/hc/en-us/articles/57881711703451-Use-Clio-Work-in-Claude-and-Codex
    // That is newer than this listing's 2026-10-27 review, which found no official connector. The page now shows both,
    // each labeled. Clio's help center returned no article for "Aila" on 2026-11-12, so no claim is made about that name.
    // Claude Sonnet 5.5, 2026-11-13: replaced the old "refresh it in the catalog flow" note. The catalog entry for slug `clio`
    // (Clio Manage) keeps mcp_confirmed false on purpose: the Claude connector belongs to Clio Work, a different product and
    // license tier, and that listing makes no MCP claim. A new source record also needs a sha256 of the fetched page, and
    // help.clio.com returns 403 to scripted fetches, so none was invented. The connector is recorded here with its source and
    // review date (2026-11-13). Clio documents no install URL or public server address on that page, so none is listed.
    lead: 'Clio documents an official Claude connector, Clio for Claude, for its Clio Work product. Community-built MCP servers for Clio Manage data also exist. This page covers both, each with its source and what it can do.',
    vendorConnector: {
      name: 'Clio for Claude (Clio Work)',
      summary: 'Clio documents a separate Claude connector that runs on Clio Work, not on Clio Manage alone. Claude can ask Clio Work to research a question, review documents or draft, using the matter context and legal sources in your Clio account. Clio says firm records stay in Clio and Claude receives only what Clio Work returns. Clio documents adding it from the Claude desktop app (Customize, then Connectors) and lists no public server address.',
      requirements: 'A Clio Identity login linked to a Clio Work user account, a Clio Work license assigned by your firm’s Clio administrator, and the Claude desktop app. Clio Grow records also need Clio Grow connected to Clio Manage.',
      permissions: 'Clio shows a Read and Write access request when you connect. Each Clio Work tool starts at Needs approval in Claude. Review the request before you authorize it.',
      source: 'https://help.clio.com/hc/en-us/articles/57881711703451-Use-Clio-Work-in-Claude-and-Codex',
      sourceLabel: 'Clio help center: Use Clio Work in Claude and Codex',
      reviewed: '2026-11-13',
    },
    faqs: [
      {
        q: 'Does Clio have an MCP server?',
        a: 'Clio documents a connector called Clio for Claude, which runs on its Clio Work product. Each person connects with a Clio Identity login linked to a Clio Work license, and the connector asks for read and write access. That is separate from Clio Manage. Community-built MCP servers for Clio Manage data also exist; see the community setup on this page.',
      },
      {
        q: 'What does Clio for Claude do?',
        a: 'Clio says Claude can call on Clio Work for the legal part of a larger task. Clio Work researches the question, reviews documents or drafts using the matter context and legal sources in your account, then returns the result with its sources. Clio says firm records stay in Clio.',
      },
      {
        q: 'Does Clio for Claude cost extra?',
        a: 'Clio says Clio for Claude is included with Clio Work at no extra cost. You still need a Clio Work license, which your firm’s Clio administrator assigns. Confirm current Clio Work plans and prices with Clio.',
      },
      {
        q: 'What can the community Clio MCP server do?',
        a: 'The CHLEGAL community implementation exposes Clio matter, contact, time, task, calendar and billing tools. It includes write actions and needs Clio developer access, so inspect its code and permissions before you connect firm data. No independent security test has been performed.',
      },
    ],
    faqSources: [
      { label: 'Clio help center: Use Clio Work in Claude and Codex', url: 'https://help.clio.com/hc/en-us/articles/57881711703451-Use-Clio-Work-in-Claude-and-Codex' },
      { label: 'CHLEGAL community repository', url: 'https://github.com/CHLEGAL/clio-mcp-server' },
    ],
    faqsChecked: '2026-11-13',
  },
]

export function getSoftwareConnection(slug: string): SoftwareConnection | undefined {
  return SOFTWARE_CONNECTIONS.find(connection => connection.slugs.includes(slug))
}
