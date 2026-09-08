import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Gate repeated claims drift: a protocol or a form is not proof of delivery.
const read = (path: string) => readFileSync(resolve(__dirname, '..', path), 'utf8')

describe('conversion claims stay within implemented behavior', () => {
  it('does not imply an automatic privacy guarantee or effortless setup', () => {
    for (const file of ['app/page.tsx', 'app/components/LeadGenCTA.tsx', 'app/components/FAQ.tsx']) {
      expect(read(file)).not.toMatch(/MCP keeps it private by design|Your data stays in your infrastructure|Connect in minutes|Most firms are operational in under two weeks/)
    }
  })
  it('does not promise email delivery without a mail implementation', () => {
    expect(read('app/components/ChecklistOptin.tsx')).not.toMatch(/email you a copy|One email per week|Send me the checklist/)
    expect(read('app/components/ChecklistOptin.tsx')).toContain('Read without signing up')
  })
  it('distinguishes paid placements on cards and detail pages', () => {
    expect(read('lib/types.ts')).toContain('logo_url, featured, featured_until')
    for (const file of ['app/components/ListingCard.tsx', 'app/servers/[slug]/page.tsx']) {
      expect(read(file)).toContain("listing.featured_until ? 'Sponsored' : 'Featured'")
    }
  })
  it('does not ship unsupported paid analytics or send planner inputs', () => {
    expect(read('app/workflow-plan/planner.tsx')).not.toMatch(/@vercel\/analytics|fetch\(|localStorage|sessionStorage/)
    expect(read('app/components/AssessmentBooking.tsx')).toContain('utm_source=legalaimcp')
  })
})
