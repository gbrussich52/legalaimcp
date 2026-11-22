// classification: PUBLIC
// Claude Sonnet 5.5, 2026-11-22: Supabase CLI 3.x rejects `db query --linked` on hosted projects.
import test from 'node:test'
import assert from 'node:assert/strict'
import { PROJECT_REF, supabaseArgv } from './supabase-argv.mjs'

test('read query is read-only, never --yes, never --linked', () => {
  const argv = supabaseArgv('select 1', { write: false })
  assert.deepEqual(argv, ['db', 'query', `--remote=${PROJECT_REF}`, '--read-only', '--output-format', 'json', 'select 1'])
  assert.ok(!argv.includes('--yes'))
  assert.ok(!argv.includes('--linked'))
})
test('write query carries --yes, never --read-only, never --linked', () => {
  const argv = supabaseArgv('update x set y = 1', { write: true })
  assert.deepEqual(argv, ['db', 'query', `--remote=${PROJECT_REF}`, '--yes', '--output-format', 'json', 'update x set y = 1'])
  assert.ok(!argv.includes('--read-only'))
  assert.ok(!argv.includes('--linked'))
})
test('write must be stated; a missing flag is an error, not a silent read', () => {
  assert.throws(() => supabaseArgv('select 1'), /write/)
  assert.throws(() => supabaseArgv('select 1', {}), /write/)
})
