import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Clears expired paid Featured bumps.
 * Protect with CRON_SECRET: Authorization: Bearer <CRON_SECRET>
 * Editorial featured (featured=true, featured_until IS NULL) is never cleared.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.includes('placeholder')) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }

  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminClient()
    const now = new Date().toISOString()

    const { data, error } = await db
      .from('listings')
      .update({ featured: false })
      .eq('featured', true)
      .not('featured_until', 'is', null)
      .lt('featured_until', now)
      .select('id, slug')

    if (error) {
      console.error('[cron/expire-featured]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      expired: data?.length ?? 0,
      listings: data ?? [],
    })
  } catch (err) {
    console.error('[cron/expire-featured] admin client', err)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(req: Request) {
  return GET(req)
}
