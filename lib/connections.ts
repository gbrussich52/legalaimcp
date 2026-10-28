// classification: PUBLIC
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
}

export const SOFTWARE_CONNECTIONS: readonly SoftwareConnection[] = [
  {
    slugs: ['imanage-work'],
    name: 'iManage Work',
    kind: 'official',
    workflow: 'Find and work with governed document and email content through iManage connectors.',
    requirements: 'An eligible iManage Work account. Team and Enterprise Claude organizations may require an administrator to enable the connector.',
    permissions: 'The vendor documents read permissions by default. Available tools depend on administrator configuration; review the authorization screen before granting access.',
    setup: 'In Claude connector settings, search for iManage Work, connect, and sign in with your iManage account. Custom connector URLs depend on the connector and any company subdomain; use the vendor instructions rather than guessing a tenant URL.',
    source: 'https://docs.imanage.com/ai/mcpserver-user-help/en-US/Adding_MCP_connectors_for_Claude.html',
    sourceLabel: 'iManage connector documentation',
    reviewed: '2026-10-27',
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
  },
]

export function getSoftwareConnection(slug: string): SoftwareConnection | undefined {
  return SOFTWARE_CONNECTIONS.find(connection => connection.slugs.includes(slug))
}
