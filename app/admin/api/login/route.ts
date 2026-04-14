import { NextResponse } from 'next/server'
import { adminLogin } from '@/lib/admin-auth'

export async function POST(request: Request) {
  let password: string

  try {
    const body = await request.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  const success = await adminLogin(password)

  if (!success) {
    // Deliberate delay to slow brute-force attempts
    await new Promise((r) => setTimeout(r, 1000))
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
