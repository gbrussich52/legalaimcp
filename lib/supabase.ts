import { createClient } from '@supabase/supabase-js'

// 2026-09-11: LegalAIMCP lives in schema `legalaimcp` of the estate's one Supabase project
// (ref bzrdzchrdthyrhdsodla). Every client selects that schema here; queries stay unchanged.
export const SUPABASE_SCHEMA = 'legalaimcp'

export function createSchemaClient(
  url: string,
  key: string,
  options: { auth?: { persistSession: boolean; autoRefreshToken: boolean }; global?: { fetch: typeof fetch } } = {}
) {
  return createClient(url, key, { ...options, db: { schema: SUPABASE_SCHEMA } })
}

/** Bounded cache for public reads only; form writes must never be cached. */
export const fetchPublicCatalog: typeof fetch = (input, init) => {
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
  return fetch(input, method === 'GET' || method === 'HEAD'
    ? { ...init, cache: 'force-cache', next: { revalidate: 300 } }
    : { ...init, cache: 'no-store', next: { revalidate: 0 } })
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
  return createSchemaClient(supabaseUrl, supabaseAnonKey, {
    // Public catalog reads must not outlive the maintenance data indefinitely.
    // Admin clients use the factory separately and do not inherit this cache.
    global: { fetch: fetchPublicCatalog },
  })
}

export const supabase = createSupabaseClient()
