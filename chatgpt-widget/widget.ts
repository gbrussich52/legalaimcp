import { App, applyDocumentTheme } from '@modelcontextprotocol/ext-apps'
import type { ShortlistResult } from '../lib/chatgpt-shortlist'
declare global { interface Window { __LEGAL_PREVIEW__?: boolean } }
const form = document.querySelector<HTMLFormElement>('#finder')!
const status = document.querySelector<HTMLElement>('#status')!
const results = document.querySelector<HTMLElement>('#results')!
const submit = document.querySelector<HTMLButtonElement>('#submit')!
let app: App | undefined
let busy=false
const el=(tag:string,value?:unknown,className?:string)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=String(value);if(className)node.className=className;return node}
function link(label:string,value:unknown){
  const node=el('a',label) as HTMLAnchorElement
  try { const url=new URL(String(value)); if(url.protocol!=='https:' || url.username || url.password) throw Error(); node.href=url.href;node.target='_blank';node.rel='noopener noreferrer' }
  catch {node.removeAttribute('href');node.textContent=label+' unavailable'}
  return node
}
function showError(message:string){results.replaceChildren();status.textContent=message}
function render(data:ShortlistResult){
  if(!data || !Array.isArray(data.tools) || !Array.isArray(data.steps)) {showError('No shortlist data was returned. Try again.');return}
  results.replaceChildren()
  status.textContent=`${data.count} matching ${data.count===1?'tool':'tools'} from ${data.catalog_count} published listings. ${data.free_only?'Only listings labeled free.':''}`
  const head=el('div',undefined,'result-head');head.append(el('h2',data.workflow),el('span',`Retrieved ${data.retrieved_at.slice(0,16).replace('T',' ')} UTC`,'timestamp'));results.append(head)
  if(!data.tools.length) results.append(el('p','No published tools match these choices. Try another workflow or turn off the free-only filter. No substitute recommendations were invented.','empty'))
  const cards=el('div',undefined,'cards')
  data.tools.slice(0,5).forEach((tool,index)=>{
    const card=el('article',undefined,'card');card.append(el('div',String(index+1).padStart(2,'0'),'index'),el('h3',tool.name),el('span',tool.pricing,'pricing'),el('p',tool.summary),el('p',tool.pricing_note))
    const why=el('ul');tool.reasons.forEach(reason=>why.append(el('li',reason)));card.append(why)
    const evidence=el('div',undefined,'evidence');evidence.append(el('div',tool.connection_type ? `${tool.connection_type==='official'?'Publisher-documented':'Community'} connection` : 'No reviewed connection guide'),el('div',`Docs reviewed: ${tool.source_reviewed_at ?? 'not recorded'}`),el('div',`Links checked: ${tool.links_checked_at ?? 'not confirmed'}`),el('div',tool.compatibility));card.append(evidence)
    const details=el('details');details.append(el('summary','Requirements & permissions'),el('p',tool.requirements),el('p',tool.permissions));card.append(details)
    const links=el('div',undefined,'links');links.append(link('Catalog record ↗',tool.listing_url));if(tool.source_url)links.append(link('Source ↗',tool.source_url));card.append(links);cards.append(card)
  });results.append(cards)
  const trial=el('section',undefined,'trial');trial.append(el('h3','Before you connect anything'));const steps=el('ol');data.steps.forEach(step=>steps.append(el('li',step)));trial.append(steps,el('p',data.boundary));results.append(trial)
  results.append(el('p',data.methodology,'method'),el('p',data.freshness_note,'method'))
}
document.addEventListener('click',(event)=>{
  const target=event.target instanceof Element ? event.target.closest('a') : null
  if(!window.__LEGAL_PREVIEW__ && app && target instanceof HTMLAnchorElement && target.href.startsWith('https://')){
    event.preventDefault();app.openLink({url:target.href}).catch(()=>{status.textContent='The source could not be opened. Use its catalog record in the web preview.'})
  }
})
form.addEventListener('submit',async(event)=>{
  event.preventDefault();if(busy)return;busy=true;submit.disabled=true;status.textContent='Reading the published catalog…';results.replaceChildren()
  const fields=new FormData(form)
  const args={workflow:String(fields.get('workflow')),firm_size:String(fields.get('firm_size')),free_only:fields.get('free_only')==='on',limit:3}
  try {
    if(window.__LEGAL_PREVIEW__){const response=await fetch('/api/chatgpt?'+new URLSearchParams({...args,free_only:String(args.free_only),limit:'3'}));if(!response.ok)throw Error();render(await response.json())}
    else if(app){const response=await app.callServerTool({name:'build_legal_ai_shortlist',arguments:args});if(response.isError)throw Error();render(response.structuredContent as ShortlistResult)}
    else throw Error()
  } catch {showError('The catalog could not be retrieved. Try again later. No sample results were substituted.')}
  finally {busy=false;submit.disabled=false}
})
if(!window.__LEGAL_PREVIEW__){
  submit.disabled=true
  app=new App({name:'LegalAIMCP workflow desk',version:'1.0.0'},{},{autoResize:true})
  app.ontoolresult=(result)=>{if(result.isError){showError('The catalog could not be retrieved. Try again later.');return}render(result.structuredContent as ShortlistResult)}
  app.onhostcontextchanged=(ctx)=>{if(ctx.theme)applyDocumentTheme(ctx.theme)}
  app.connect().then(()=>{submit.disabled=false;const theme=app?.getHostContext()?.theme;if(theme)applyDocumentTheme(theme)}).catch(()=>showError('The ChatGPT connection is unavailable. Open the web preview at legalaimcp.com/chatgpt.'))
}
