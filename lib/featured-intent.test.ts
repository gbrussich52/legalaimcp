import { expect, it } from 'vitest'
import { intentFormSchema, isAcceptableWorkEmail, CANCEL_REASONS, FEATURED_ROLES } from '@/lib/featured-intent'

it('accepts a normal work email, normalized', () => {
  const r = intentFormSchema.safeParse({ slug: 'gavel', email: '  Jane@Firm.COM ', role: 'works_here' })
  expect(r.success && r.data.email).toBe('jane@firm.com')
})
it('rejects malformed and disposable emails by format only', () => {
  for (const e of ['', 'nope', 'a@b', 'a b@firm.com', 'x@mailinator.com', 'x@guerrillamail.com']) expect(isAcceptableWorkEmail(e)).toBe(false)
})
it('role is a closed enum', () => {
  expect(FEATURED_ROLES).toEqual(['works_here', 'agency', 'just_looking'])
  expect(intentFormSchema.safeParse({ slug: 'g', email: 'a@firm.com', role: 'ceo' }).success).toBe(false)
  expect(CANCEL_REASONS).toEqual(['price', 'approval', 'detail', 'just_looking'])
})
