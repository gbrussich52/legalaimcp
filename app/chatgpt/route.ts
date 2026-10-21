import { createHash } from 'node:crypto'
import { widgetHtml, widgetStyleHash } from '@/lib/chatgpt-widget.generated'
/** Standalone app surface avoids unrelated website sales/navigation/analytics. */
export async function GET() {
  const html=widgetHtml.replace('<script>','<script>window.__LEGAL_PREVIEW__=true;')
  const script=html.match(/<script>([\s\S]*)<\/script>/)?.[1] ?? ''
  const hash=createHash('sha256').update(script).digest('base64')
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':`default-src 'none'; script-src 'sha256-${hash}'; style-src 'sha256-${widgetStyleHash}'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`}})
}
