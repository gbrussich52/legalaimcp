import { NextResponse } from 'next/server'
import { adminLogout } from '@/lib/admin-auth'
import { isSameOriginRequest } from '@/lib/origin'

export async function POST(request: Request) {
  // CSRF defense (audit S2): logout is a state-changing action triggered by a
  // plain form POST — reject cross-origin requests so a third-party page
  // cannot force-logout (or, more importantly, probe) the admin session.
  if (!isSameOriginRequest(request.headers)) {
    return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 })
  }

  await adminLogout()
  return NextResponse.redirect(new URL('/admin/login', request.url))
}
