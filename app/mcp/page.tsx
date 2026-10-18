import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/constants'
import { McpServerJsonLd } from '../components/JsonLd'

/**
 * The install page for our own MCP server.
 *
 * This is the distribution asset, not documentation. MCP registries
 * (modelcontextprotocol registry, mcp.so, Smithery, PulseMCP,
 * awesome-mcp-servers) all link to a canonical page, and a server nobody can
 * find the install snippet for does not get listed. Keep the endpoint URL and
 * the JSON block copy-paste correct — everything else here is secondary.
 */

const ENDPOINT = `${SITE_URL}/api/mcp`

export const metadata: Metadata = {
  title: `Legal AI Directory MCP Server: Claude Setup`,
  description: `Connect Claude, ChatGPT, or any MCP client to the ${SITE_NAME} directory of legal AI tools. Free, read-only, no API key. Find tools for law firms.`,
  alternates: { canonical: `${SITE_URL}/mcp` },
  openGraph: {
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'LegalAIMCP — legal AI tools and MCP servers' }],
    title: 'Legal AI Directory MCP Server: Claude Setup',
    description: 'Connect to the free read-only LegalAIMCP directory. Search published legal AI listings; no API key or account required.',
    url: `${SITE_URL}/mcp`,
  },
}

const TOOLS = [
  {
    name: 'search_legal_ai_tools',
    desc: 'Search the directory by free text, practice area, and pricing model.',
  },
  {
    name: 'get_legal_ai_tool',
    desc: 'Full listing for one tool, including description and install command.',
  },
  {
    name: 'list_legal_ai_categories',
    desc: 'The practice areas covered, with a live count of tools in each.',
  },
  {
    name: 'recommend_legal_ai_tools',
    desc: 'Rank tools by fit for a practice area and firm size, with a score and the matched factors behind it.',
  },
]

const CLAUDE_CODE = `claude mcp add --transport http legalaimcp ${ENDPOINT}`

const CLIENT_JSON = `{
  "mcpServers": {
    "legalaimcp": {
      "type": "http",
      "url": "${ENDPOINT}"
    }
  }
}`

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-navy text-slate-100 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed">
      <code>{children}</code>
    </pre>
  )
}

export default function McpPage() {
  return (
    <main className="bg-white">
      <McpServerJsonLd />
      <section className="bg-navy text-white py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-gold-text mb-3">
            For AI assistants
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
            Connect the LegalAIMCP directory MCP server
          </h1>
          <p className="font-body text-slate-300 mt-5 text-lg leading-relaxed">
            {SITE_NAME} runs its own MCP server. Connect it once and your
            assistant can search every tool in the directory directly — no
            copying links out of a browser tab.
          </p>
          <p className="font-body text-slate-400 mt-3 text-sm">
            Free · read-only · no API key · no account
          </p>
          <p className="font-body text-slate-300 mt-4">
            This server searches public tool listings. It does not search case law, access
            client files, or connect your firm to the products it lists.
          </p>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">Claude Code</h2>
            <Code>{CLAUDE_CODE}</Code>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              Claude web and Claude Desktop
            </h2>
            <p className="font-body text-charcoal/75 mb-3 leading-relaxed">
              Open Customize → Connectors → Add custom connector, enter LegalAIMCP
              as the name, and use this remote server URL. Choose No sign in when
              prompted, then enable the connector in your conversation. Team and
              Enterprise accounts may require an owner to add it first.
            </p>
            <Code>{ENDPOINT}</Code>
            <p className="font-body text-charcoal/75 mt-3">
              Remote connectors use your Claude account; do not paste the HTTP JSON
              below into claude_desktop_config.json. Follow{' '}
              <a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" className="text-gold-text underline">Claude&apos;s current connector instructions</a>.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">Other HTTP MCP clients</h2>
            <p className="font-body text-charcoal/75 mb-3">
              For clients that support this mcpServers HTTP configuration format,
              use the example below. Other clients require their own settings format.
            </p>
            <Code>{CLIENT_JSON}</Code>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-navy mb-3">Test the connection</h2>
            <p className="font-body text-charcoal/75">
              Ask: “Use LegalAIMCP to find legal research tools and show each listing&apos;s
              link-check date.” Expect directory listings, not case citations. If no tools
              appear, confirm that your client supports Streamable HTTP and that the connector
              is enabled. Do not send confidential client information in search queries.
            </p>
            <p className="font-body mt-3">
              Prefer browsing? <Link href="/best/legal-mcp-servers" className="text-gold-text underline">Compare legal MCP servers and AI tools</Link>.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-navy mb-4">What you get</h2>
            <ul className="space-y-3">
              {TOOLS.map((t) => (
                <li key={t.name} className="border border-slate-200 rounded-lg p-4">
                  <code className="font-mono text-sm text-navy font-semibold">{t.name}</code>
                  <p className="font-body text-charcoal/75 text-sm mt-1.5 leading-relaxed">
                    {t.desc}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-navy p-6 sm:p-8 text-white">
            <h2 className="font-display text-2xl">Already running an AI integration?</h2>
            <p className="mt-3 text-slate-200">Scope a monitoring pilot that checks whether it still returns the results your team expects. Start with fictional examples and one read-only workflow.</p>
            <Link href="/pilot?source=mcp" className="inline-block mt-5 rounded-lg bg-white px-5 py-3 font-semibold text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Explore the monitoring pilot</Link>
          </div>

          <div className="border-t border-slate-200 pt-8">
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              What it does and doesn&apos;t do
            </h2>
            <div className="font-body text-charcoal/75 space-y-3 leading-relaxed">
              <p>
                It is read-only. It serves exactly the listings this website
                already publishes, so it can reach nothing that loading a page
                here wouldn&apos;t. There is no write path — tools are submitted
                through{' '}
                <Link href="/submit" className="text-gold-text font-semibold hover:underline">
                  the form
                </Link>{' '}
                and reviewed by a person before they go live.
              </p>
              <p>
                Results include whether a listing&apos;s links passed our last
                automated check, and the date of that check.{' '}
                <Link href="/about#verified" className="text-gold-text font-semibold hover:underline">
                  That badge means one narrow thing
                </Link>{' '}
                — the links resolved — and is not an endorsement, security
                audit, or legal advice. Your assistant will repeat the caveat
                because we send it with every result.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
