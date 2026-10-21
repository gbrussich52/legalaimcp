import { getShortlist, ShortlistInput } from '@/lib/chatgpt-shortlist'
export async function GET(request: Request) {
  const search = new URL(request.url).searchParams
  if ([...search.keys()].some(key=>!['workflow','firm_size','free_only','limit'].includes(key)) || [...search.keys()].some(key=>search.getAll(key).length!==1)) return Response.json({error:'Use only the workflow, firm_size, free_only and limit choices.'},{status:400})
  const raw = Object.fromEntries(search)
  const parsed=ShortlistInput.safeParse({...raw, ...(raw.free_only ? {free_only:raw.free_only === 'true' ? true : raw.free_only === 'false' ? false : raw.free_only} : {}), ...(raw.limit ? {limit:Number(raw.limit)} : {})})
  if(!parsed.success) return Response.json({error:'Choose a supported workflow, firm size, free-only flag and a limit from 1 to 5.'},{status:400})
  try { return Response.json(await getShortlist(parsed.data),{headers:{'Cache-Control':'no-store'}}) }
  catch { return Response.json({error:'The live catalog is temporarily unavailable. Try again later; no sample results were substituted.'},{status:503,headers:{'Cache-Control':'no-store'}}) }
}
