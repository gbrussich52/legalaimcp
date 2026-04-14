import { NextResponse } from 'next/server'
import { adminLogout } from '@/lib/admin-auth'

export async function POST() {
  await adminLogout()
  return NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL || 'https://legalaimcp.com'))
}
