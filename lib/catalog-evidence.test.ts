import {describe,it,expect} from 'vitest'
import registry from './catalog-reviews.json'
import {catalogFingerprint} from './catalog-review'
import {getCatalogEvidence} from './catalog-evidence'
import {getAllPosts} from './blog'
describe('published claim evidence',()=>{
 it('binds every accepted product to its exact copy, primary sources and explicit review',()=>{
  expect(registry.reviews.length).toBeGreaterThan(0)
  expect(new Set(registry.reviews.map(r=>r.slug)).size).toBe(registry.reviews.length)
  for(const review of registry.reviews){
   expect(catalogFingerprint(review.claims)).toBe(review.listing_sha256)
   expect(review.identity_confirmed).toBe(true);expect(review.capabilities_confirmed).toBe(true)
   expect(review.claims.mcp_install_command).toBeNull()
   expect(review.claims.firm_size_fit).toEqual([])
   expect(getCatalogEvidence(review.claims)?.source_urls).toEqual(review.sources.map(s=>s.url))
   expect(registry.blocked_slugs).not.toContain(review.slug)
  }
 })
 it('withholds a review label when identity, destination or public capability copy changes',()=>{
  const row=registry.reviews[0].claims
  for(const change of [{name:'Unrelated business'},{external_url:'https://unrelated.example'},{description:'Invented legal capability'}])expect(getCatalogEvidence({...row,...change})).toBeNull()
  expect(getCatalogEvidence({slug:row.slug})).toBeNull()
 })
 it('corrects every supporting article with a revision date and primary-source references',()=>{
  const posts=getAllPosts();expect(posts).toHaveLength(6)
  for(const post of posts){expect(post.updatedDate).toBe('2026-10-27');expect(post.content).toContain('https://');expect(post.content).not.toMatch(/data doesn.t leave your infrastructure|paralegal that never makes typos|\$50,000|\$5,000/)}
  expect(posts.find(p=>p.slug==='ai-contract-review-tools-compared')?.title).toMatch(/^Three /)
 })
})
