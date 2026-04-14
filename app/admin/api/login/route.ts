import { NextResponse } from 'next/server'
import { adminLogin } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const { password } = await request.json()
  const success = await adminLogin(password)

  if (success) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}
