import { describe, it, expect } from 'vitest'
import { sanitizeLogoUrl } from './logo-url'

describe('sanitizeLogoUrl (S4 — logo_url allowlist)', () => {
  it('accepts a clean https URL', () => {
    expect(sanitizeLogoUrl('https://cdn.example.com/logo.png')).toBe(
      'https://cdn.example.com/logo.png',
    )
  })

  it('returns null for null/undefined/empty input', () => {
    expect(sanitizeLogoUrl(null)).toBeNull()
    expect(sanitizeLogoUrl(undefined)).toBeNull()
    expect(sanitizeLogoUrl('')).toBeNull()
  })

  it('rejects javascript: URLs', () => {
    expect(sanitizeLogoUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeLogoUrl('JaVaScRiPt:alert(1)')).toBeNull()
  })

  it('rejects data: URLs', () => {
    expect(sanitizeLogoUrl('data:image/svg+xml,<svg onload=alert(1)>')).toBeNull()
  })

  it('rejects plain http: (downgrade / mixed content)', () => {
    expect(sanitizeLogoUrl('http://cdn.example.com/logo.png')).toBeNull()
  })

  it('rejects file:, blob:, vbscript: and other protocols', () => {
    expect(sanitizeLogoUrl('file:///etc/passwd')).toBeNull()
    expect(sanitizeLogoUrl('blob:https://example.com/uuid')).toBeNull()
    expect(sanitizeLogoUrl('vbscript:msgbox(1)')).toBeNull()
  })

  it('rejects URLs with embedded credentials', () => {
    expect(sanitizeLogoUrl('https://user:pass@evil.com/logo.png')).toBeNull()
    expect(sanitizeLogoUrl('https://admin@evil.com/logo.png')).toBeNull()
  })

  it('rejects relative paths and unparseable garbage', () => {
    expect(sanitizeLogoUrl('/logo.png')).toBeNull()
    expect(sanitizeLogoUrl('not a url at all')).toBeNull()
    expect(sanitizeLogoUrl('https://')).toBeNull()
  })

  it('rejects localhost and single-label hosts', () => {
    expect(sanitizeLogoUrl('https://localhost/logo.png')).toBeNull()
    expect(sanitizeLogoUrl('https://intranet/logo.png')).toBeNull()
  })

  it('rejects protocol-confusion payloads', () => {
    expect(sanitizeLogoUrl(' javascript:alert(1)')).toBeNull()
    expect(sanitizeLogoUrl('https:javascript:alert(1)')).toBeNull()
  })
})
