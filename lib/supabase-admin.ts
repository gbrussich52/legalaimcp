/**
 * Server-only Supabase client with service role key.
 * Bypasses RLS — use ONLY in admin server actions and admin pages
 * where the request is already authenticated via admin cookie.
 *
 * NEVER import this in client components or public-facing pages.
 */
import { createSchemaClient, type SchemaClient } from './supabase'

export function getAdminClient(): SchemaClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || url === 'undefined' || !key || key === 'undefined') {
    throw new Error(
      'Admin Supabase client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createSchemaClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
