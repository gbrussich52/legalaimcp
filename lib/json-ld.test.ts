import { describe, it, expect } from 'vitest'
import { toJsonLd } from './json-ld'

describe('toJsonLd', () => {
  it('never emits a literal "<" so </script> cannot break out of the tag', () => {
    const out = toJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('<')
    expect(JSON.parse(out)).toEqual({ name: '</script><script>alert(1)</script>' })
  })

  it('escapes line/paragraph separators that break inline scripts', () => {
    const out = toJsonLd({ name: 'a\u2028b\u2029c' })
    expect(out).not.toMatch(/[\u2028\u2029]/)
    expect(JSON.parse(out)).toEqual({ name: 'a\u2028b\u2029c' })
  })

  it('leaves ordinary schema untouched', () => {
    const schema = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'x' }
    expect(JSON.parse(toJsonLd(schema))).toEqual(schema)
  })
})
