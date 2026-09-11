import { createClient } from '@supabase/supabase-js'

// 2026-09-11: LegalAIMCP lives in schema `legalaimcp` of the estate's one Supabase project
// (ref bzrdzchrdthyrhdsodla). Every client selects that schema here; queries stay unchanged.
export const SUPABASE_SCHEMA = 'legalaimcp'

export function createSchemaClient(
  url: string,
  key: string,
  options: { auth?: { persistSession: boolean; autoRefreshToken: boolean } } = {}
) {
  return createClient(url, key, { ...options, db: { schema: SUPABASE_SCHEMA } })
}

export type SchemaClient = ReturnType<typeof createSchemaClient>

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Returns a Supabase client, or null when env vars are not yet configured.
 * This allows the app to build and render empty states without a live connection.
 *
 * Note: checks for the literal string "undefined" to handle Next.js build-time
 * env var stringification where missing vars become the string "undefined".
 */
function createSupabaseClient(): SchemaClient | null {
  if (
    !supabaseUrl ||
    supabaseUrl === 'undefined' ||
    !supabaseAnonKey ||
    supabaseAnonKey === 'undefined'
  ) {
    // Not connected yet — graceful degradation to empty states
    return null
  }
  return createSchemaClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()
