import { createHash } from 'node:crypto'
import { SITE_URL } from './constants'
// Claude Sonnet 5.5, 2026-11-19: these three hand-built HTML pages had no meta description, Open Graph or X card tags and
// were missing from the sitemap (Ahrefs 11/19). One table feeds the tags, the sitemap and the guard test, so they cannot drift.
// `modified` is the last git commit date of the page source.
export const CHATGPT_PAGES = {
  '/chatgpt': {
    title: 'LegalAIMCP · Workflow shortlist',
    description: 'Free web preview of the LegalAIMCP workflow desk. Pick a legal workflow, firm size and pricing choice to get a shortlist of listed software.',
    modified: '2026-10-20',
  },
  '/chatgpt/privacy': {
    title: 'ChatGPT app privacy · LegalAIMCP',
    description: 'How the free LegalAIMCP workflow desk for ChatGPT handles your choices, search words and server logs. No account, upload or tracking pixel.',
    modified: '2026-10-23',
  },
  '/chatgpt/support': {
    title: 'Workflow desk support · LegalAIMCP',
    description: 'Help for the free LegalAIMCP workflow desk: what to try when a search fails, how to report a problem and what the directory does not do.',
    modified: '2026-10-20',
  },
} as const
export type ChatgptPath = keyof typeof CHATGPT_PAGES
const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
/** Description, Open Graph and X card tags for one page; og:url equals the canonical set in next.config.js. */
export function chatgptSocialTags(path: ChatgptPath): string {
  const { title, description } = CHATGPT_PAGES[path]
  const url = `${SITE_URL}${path}`
  const image = `${SITE_URL}/opengraph-image`
  const alt = 'LegalAIMCP: AI integrations for law firms'
  const m = (attr: 'name' | 'property', key: string, value: string) => `<meta ${attr}="${key}" content="${esc(value)}">`
  return [
    m('name', 'description', description),
    m('property', 'og:type', 'website'), m('property', 'og:site_name', 'LegalAIMCP'), m('property', 'og:locale', 'en_US'),
    m('property', 'og:url', url), m('property', 'og:title', title), m('property', 'og:description', description),
    m('property', 'og:image', image), m('property', 'og:image:width', '1200'), m('property', 'og:image:height', '630'), m('property', 'og:image:alt', alt),
    m('name', 'twitter:card', 'summary_large_image'), m('name', 'twitter:title', title), m('name', 'twitter:description', description),
    m('name', 'twitter:image', image), m('name', 'twitter:image:alt', alt),
  ].join('')
}
const css=':root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;background:#f7f5ef;color:#182e32;font:16px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:760px;margin:50px auto;padding:32px}h1,h2{font-family:Georgia,serif;font-weight:400;line-height:1.15}h1{font-size:42px;margin:42px 0 28px}h2{font-size:26px;margin:35px 0 16px}p{color:#536564}a{color:#285848;text-underline-offset:4px}hr{border:0;border-top:1px solid #d5dcd4;margin-top:42px}:focus-visible{outline:3px solid #c28b45;outline-offset:4px}@media(max-width:600px){main{margin:15px auto;padding:24px}h1{font-size:34px}}@media(prefers-color-scheme:dark){body{background:#18272a;color:#eef1e8}p{color:#b4c2bd}a{color:#b8d2b4}}'
/** Only authored, static content is accepted here. Never pass catalog or request text. */
export function informationPage(path: Exclude<ChatgptPath, '/chatgpt'>, title: string, body: string) {
  const hash=createHash('sha256').update(css).digest('base64')
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · LegalAIMCP</title>${chatgptSocialTags(path)}<style>${css}</style><body><main><a href="/chatgpt">← LegalAIMCP workflow desk</a><h1>${title}</h1>${body}<hr><p><a href="/chatgpt/privacy">Privacy</a> · <a href="/chatgpt/support">Support</a></p></main></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':`default-src 'none'; style-src 'sha256-${hash}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,'Cache-Control':'public, max-age=300'}})
}
