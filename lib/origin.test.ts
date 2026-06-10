import { describe, it, expect } from 'vitest'
import { isSameOriginRequest } from './origin'

function h(record: Record<string, string>): Headers {
  return new Headers(record)
}

describe('isSameOriginRequest (CSRF same-origin check)', () => {
  it('allows a same-origin browser request (origin + sec-fetch-site match)', () => {
    expect(
      isSameOriginRequest(
        h({
          host: 'legalaimcp.com',
          origin: 'https://legalaimcp.com',
          'sec-fetch-site': 'same-origin',
        }),
      ),
    ).toBe(true)
  })

  it('allows direct navigation (sec-fetch-site: none)', () => {
    expect(
      isSameOriginRequest(h({ host: 'legalaimcp.com', 'sec-fetch-site': 'none' })),
    ).toBe(true)
  })

  it('rejects cross-site sec-fetch-site even when origin matches', () => {
    expect(
      isSameOriginRequest(
        h({
          host: 'legalaimcp.com',
          origin: 'https://legalaimcp.com',
          'sec-fetch-site': 'cross-site',
        }),
      ),
    ).toBe(false)
  })

  it('rejects same-site (subdomain) sec-fetch-site', () => {
    expect(
      isSameOriginRequest(h({ host: 'legalaimcp.com', 'sec-fetch-site': 'same-site' })),
    ).toBe(false)
  })

  it('rejects a mismatched Origin header', () => {
    expect(
      isSameOriginRequest(h({ host: 'legalaimcp.com', origin: 'https://evil.com' })),
    ).toBe(false)
  })

  it('rejects an Origin that only prefixes the real host', () => {
    expect(
      isSameOriginRequest(h({ host: 'legalaimcp.com', origin: 'https://legalaimcp.com.evil.com' })),
    ).toBe(false)
  })

  it('rejects an unparseable Origin header', () => {
    expect(isSameOriginRequest(h({ host: 'legalaimcp.com', origin: 'null' }))).toBe(false)
    expect(isSameOriginRequest(h({ host: 'legalaimcp.com', origin: '%%garbage%%' }))).toBe(false)
  })

  it('rejects Origin present but no Host to compare against', () => {
    expect(isSameOriginRequest(h({ origin: 'https://legalaimcp.com' }))).toBe(false)
  })

  it('prefers x-forwarded-host over host (Vercel proxy)', () => {
    expect(
      isSameOriginRequest(
        h({
          host: 'internal-lambda.vercel.app',
          'x-forwarded-host': 'legalaimcp.com',
          origin: 'https://legalaimcp.com',
        }),
      ),
    ).toBe(true)
    // attacker cannot match the forwarded host with a foreign origin
    expect(
      isSameOriginRequest(
        h({
          host: 'internal-lambda.vercel.app',
          'x-forwarded-host': 'legalaimcp.com',
          origin: 'https://internal-lambda.vercel.app',
        }),
      ),
    ).toBe(false)
  })

  it('allows non-browser clients with neither Origin nor Sec-Fetch-Site (no ambient-cookie CSRF vector)', () => {
    expect(isSameOriginRequest(h({ host: 'legalaimcp.com' }))).toBe(true)
  })

  it('rejects port-mismatched origins', () => {
    expect(
      isSameOriginRequest(h({ host: 'legalaimcp.com', origin: 'https://legalaimcp.com:8443' })),
    ).toBe(false)
  })
})
