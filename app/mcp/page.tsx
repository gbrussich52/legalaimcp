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
  title: `MCP Server — Query ${SITE_NAME} From Your AI Assistant`,
  description: `Connect Claude, ChatGPT, or any MCP client to the ${SITE_NAME} directory of legal AI tools. Free, read-only, no API key. Search 45+ AI tools and MCP servers built for law firms.`,
  alternates: { canonical: `${SITE_URL}/mcp` },
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
            Query this directory from your AI assistant
          </h1>
          <p className="font-body text-slate-300 mt-5 text-lg leading-relaxed">
            {SITE_NAME} runs its own MCP server. Connect it once and your
            assistant can search every tool in the directory directly — no
            copying links out of a browser tab.
          </p>
          <p className="font-body text-slate-400 mt-3 text-sm">
            Free · read-only · no API key · no account
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
              Claude Desktop, Cursor, and other MCP clients
            </h2>
            <p className="font-body text-charcoal/70 mb-3 leading-relaxed">
              Add this to your client&apos;s MCP configuration file:
            </p>
            <Code>{CLIENT_JSON}</Code>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-navy mb-4">What you get</h2>
            <ul className="space-y-3">
              {TOOLS.map((t) => (
                <li key={t.name} className="border border-slate-200 rounded-lg p-4">
                  <code className="font-mono text-sm text-navy font-semibold">{t.name}</code>
                  <p className="font-body text-charcoal/70 text-sm mt-1.5 leading-relaxed">
                    {t.desc}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-200 pt-8">
            <h2 className="font-display text-2xl font-bold text-navy mb-3">
              What it does and doesn&apos;t do
            </h2>
            <div className="font-body text-charcoal/70 space-y-3 leading-relaxed">
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
