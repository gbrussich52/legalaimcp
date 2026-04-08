import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Returns a Supabase client, or null when env vars are not yet configured.
 * This allows the app to build and render empty states without a live connection.
 *
 * Note: checks for the literal string "undefined" to handle Next.js build-time
 * env var stringification where missing vars become the string "undefined".
 */
function createSupabaseClient(): SupabaseClient | null {
  if (
    !supabaseUrl ||
    supabaseUrl === 'undefined' ||
    !supabaseAnonKey ||
    supabaseAnonKey === 'undefined'
  ) {
    // Not connected yet — graceful degradation to empty states
    return null
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()
