// classification: PUBLIC
// Claude Sonnet 5.5, 2026-11-22: Supabase CLI 3.x rejects `db query --linked` on a hosted project
// (HostedMutationConsentRequiredError). The working form is `--remote=<ref>`; a write also needs
// --yes. Kept in its own module because importing curate.mjs would run its command line.
export const PROJECT_REF = 'bzrdzchrdthyrhdsodla'

/** argv for `supabase`; `write` must be stated so a write never runs as a quiet read or the reverse. */
export function supabaseArgv(query, { write } = {}) {
  if (typeof write !== 'boolean') throw new Error('supabaseArgv needs { write: true|false }')
  return ['db', 'query', `--remote=${PROJECT_REF}`, write ? '--yes' : '--read-only', '--output-format', 'json', query]
}
