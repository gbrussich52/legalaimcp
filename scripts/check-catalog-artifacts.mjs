// PUBLIC. Every source-reviewed row must produce the matching public evidence card.
import {readFile,access} from 'node:fs/promises'
import path from 'node:path'
const root=path.resolve(import.meta.dirname,'..')
const policy=JSON.parse(await readFile(path.join(root,'lib/catalog-reviews.json'),'utf8'))
if(!policy.reviews.length)throw Error('No reviewed catalog artifacts to verify')
for(const review of policy.reviews){
 const file=path.join(root,'.next/server/app/servers',`${review.slug}.html`)
 const html=(await readFile(file,'utf8')).split('</main>')[0]
 for(const expected of [review.claims.name,'Primary sources reviewed',review.reviewed_at,...review.sources.map(s=>s.url)]){
  if(!html.includes(expected))throw Error(`Source-reviewed page missing exact evidence: ${review.slug}`)
 }
}
for(const slug of policy.blocked_slugs){
 let exists=true;try{await access(path.join(root,'.next/server/app/servers',`${slug}.html`))}catch(e){if(e.code==='ENOENT')exists=false;else throw e}
 if(exists)throw Error(`Quarantined product returned to the published catalog: ${slug}`)
}
console.log(`Catalog artifacts PASS: ${policy.reviews.length} source-reviewed pages and ${policy.blocked_slugs.length} quarantines`)
