// Claude, 2026-11-26: Ahrefs 11/26 reported 8 external links returning 4XX (6 new). Six were listing "MCP Repository"
// links that are not repositories but the MCP server endpoint itself (for example https://api.venley.ai/mcp). An MCP
// endpoint answers a plain browser GET with an error, so a crawler sees a broken link and a visitor gets an error page.
// The listing page now prints such a URL as text to copy into an MCP client, and links only real pages.

const REPO_HOSTS = ['github.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org']

/** True when the URL is a remote MCP server endpoint (path ends in /mcp or /sse), not a repository or docs page. */
export function isMcpEndpointUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  const host = url.hostname.toLowerCase()
  if (REPO_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return false
  return /\/(mcp|sse)$/i.test(url.pathname.replace(/\/+$/, ''))
}
