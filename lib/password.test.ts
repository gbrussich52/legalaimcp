import { describe, it, expect } from 'vitest'
import { verifyAdminPassword } from './password'

describe('verifyAdminPassword (constant-time admin compare)', () => {
  it('returns true for an exact match', () => {
    expect(verifyAdminPassword('s3cr3t-password', 's3cr3t-password')).toBe(true)
  })
  it('returns false for a wrong password of the same length', () => {
    expect(verifyAdminPassword('aaaaaaaaaaaa', 'bbbbbbbbbbbb')).toBe(false)
  })
  it('returns false for a wrong password of different length (no length leak / no throw)', () => {
    expect(verifyAdminPassword('short', 'a-much-longer-expected-password')).toBe(false)
    expect(verifyAdminPassword('a-much-longer-candidate-string', 'short')).toBe(false)
  })
  it('returns false for empty candidate against a real password', () => {
    expect(verifyAdminPassword('', 'expected')).toBe(false)
  })
  it('handles unicode without throwing', () => {
    expect(verifyAdminPassword('pÄ§sswörd', 'pÄ§sswörd')).toBe(true)
    expect(verifyAdminPassword('pÄ§sswörd', 'password!!')).toBe(false)
  })
})
