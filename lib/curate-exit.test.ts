import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Claude Sonnet 5.5, 2026-11-23: curate.mjs has no import seam (it runs on load), so this reads the
// source. finish() is a const inside verify(); a call outside that scope throws ReferenceError, and
// the verify dry-run branch must call it so a failed audit still exits 2.
const lines = readFileSync('scripts/curate.mjs', 'utf8').split('\n')
const defLine = lines.findIndex((l) => l.includes('const finish ='))
const callLines = lines.map((l, i) => (/^\s*finish\(\)/.test(l) ? i : -1)).filter((i) => i >= 0)

describe('curate.mjs finish() exit handling', () => {
  it('defines finish once and never calls it before the definition', () => {
    expect(defLine).toBeGreaterThan(-1)
    expect(callLines.length).toBeGreaterThan(0)
    for (const c of callLines) expect(c).toBeGreaterThan(defLine)
  })
  it('every call sits in the same function as the definition', () => {
    const fnStart = (i: number) => {
      for (let j = i; j >= 0; j--) if (/^(async )?function /.test(lines[j])) return j
      return -1
    }
    for (const c of callLines) expect(fnStart(c)).toBe(fnStart(defLine))
  })
  it('the verify dry-run branch calls finish() before its return', () => {
    const dry = lines.findIndex((l, i) => i > defLine && l.includes("log('dry run"))
    expect(dry).toBeGreaterThan(-1)
    const ret = lines.findIndex((l, i) => i > dry && /^\s*return\b/.test(l))
    expect(callLines.some((c) => c > dry && c < ret)).toBe(true)
  })
})
