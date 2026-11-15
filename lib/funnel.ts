// Claude Fable 5.2 (executor), 2026-11-15: first-party funnel log (our own table keeps the buyer funnel out of third-party trackers and in one place we can query). Stores enums and a slug only; never email, name, IP, user agent or free text.
import { getAdminClient } from '@/lib/supabase-admin'
import { CANCEL_REASONS, FEATURED_ROLES, SLUG_RE, type FunnelStep } from '@/lib/featured-intent'

const ALLOWED: Record<string, readonly string[]> = { role: FEATURED_ROLES, reason: CANCEL_REASONS }

/** Never throws and never blocks the buyer: a failed insert is logged and dropped. */
export async function recordFunnelEvent(
  step: FunnelStep,
  slug: string | null | undefined,
  props: { role?: string; reason?: string } = {},
): Promise<void> {
  try {
    const clean: Record<string, string> = {}
    for (const [k, v] of Object.entries(props)) {
      if (!(k in ALLOWED) || typeof v !== 'string' || v.includes('@')) continue
      if (ALLOWED[k].includes(v)) clean[k] = v
    }
    const { error } = await getAdminClient().from('funnel_events').insert({
      step,
      slug: slug && SLUG_RE.test(slug) ? slug : null,
      props: clean,
    })
    if (error) console.error('[funnel] insert failed', step, error.message)
  } catch (err) {
    console.error('[funnel] record failed', step, err instanceof Error ? err.message : 'unknown')
  }
}
