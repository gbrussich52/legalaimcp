// PUBLIC. Claude Opus 5.5, 2026-11-22: logic for admitting reviewed submissions as NEW listings.
// Why: the submit form wrote to a queue nothing published from. The admin Approve button needs a deployed
// review record, and the build refuses a record whose page does not exist yet, so new listings go in the way
// earlier corrections did: a guarded SQL pack the owner applies, then a PR carrying the review records.
// Pure functions only; scripts/admit-submissions.mjs is the thin CLI. No database calls, no email.
import { randomBytes } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'

const CATEGORIES = ['document_processing', 'case_management', 'client_communication', 'legal_research', 'billing_time', 'compliance', 'general']
const PRICING = ['free', 'freemium', 'paid', 'contact']
// Same values as FIRM_SIZES in lib/recommend.ts.
const FIRM_SIZES = ['solo', 'small', 'mid', 'large']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Tab, newline and carriage return are text; every other C0/C1 control is refused.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/
const OPTIONAL_TEXT = ['mcp_install_command', 'pricing_details']
const OPTIONAL_URL = ['mcp_repo_url', 'creator_url', 'logo_url']

/** Host used for the "another published listing already points here" guard; www and case ignored. */
export const hostOf = (url) => new URL(url).hostname.toLowerCase().replace(/^www\./, '')
// The same rule in SQL, applied to existing rows. [.] avoids backslashes in the generated text.
const SQL_HOST = (col) => `regexp_replace(lower(substring(${col} from '^[A-Za-z][A-Za-z0-9+.-]*://(?:[^@/?#]*@)?([^/:?#]+)')), '^www[.]', '')`

// Claude Sonnet 5.5, 2026-11-22: the guard compared bare hosts, so every github.com repo listing blocked every
// new repo listing. On shared code and package hosts the key is host/first-two-path-segments (lower case, trailing
// .git dropped from the second segment); any other site keeps host-only. JS and SQL below must agree.
const SHARED_HOSTS = ['github.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org', 'huggingface.co', 'npmjs.com', 'pypi.org']
export const siteKey = (url) => {
  const host = hostOf(url)
  if (!SHARED_HOSTS.includes(host)) return host
  const segs = new URL(url).pathname.toLowerCase().split('/').filter(Boolean).slice(0, 2)
  if (segs.length === 2) segs[1] = segs[1].replace(/\.git$/, '')
  return `${host}/${segs.join('/')}`
}
// Returns SQL text for the same key over a column. Path = text after the authority, before ? or #.
const SQL_SITE_KEY = (col) => {
  const host = SQL_HOST(col)
  const segs = `array_remove(string_to_array(lower(coalesce(substring(${col} from '^[A-Za-z][A-Za-z0-9+.-]*://[^/?#]*(/[^?#]*)?'), '')), '/'), '')`
  const tail = `case when cardinality(${segs}) >= 2 then (${segs})[1] || '/' || regexp_replace((${segs})[2], '[.]git$', '') else array_to_string(${segs}, '/') end`
  return `(case when ${host} in (${SHARED_HOSTS.map((h) => `'${h}'`).join(', ')}) then ${host} || '/' || ${tail} else ${host} end)`
}

class Refusal extends Error {}
const refuse = (message) => { throw new Refusal(message) }

function cleanText(value, field) {
  if (typeof value !== 'string') refuse(`${field}: must be text`)
  if (CONTROL.test(value) || !value.isWellFormed()) refuse(`${field}: contains a control character or broken Unicode`)
  return value
}
function boundedText(value, field, min, max, { noMarkup = false } = {}) {
  cleanText(value, field)
  if (value.length < min || value.length > max) refuse(`${field}: must be ${min} to ${max} characters`)
  if (noMarkup && /[<>]/.test(value)) refuse(`${field}: angle brackets are not allowed`)
  return value
}
function httpsUrl(value, field) {
  cleanText(value, field)
  let url
  try { url = new URL(value) } catch { refuse(`${field}: not a valid URL`) }
  if (url.protocol !== 'https:') refuse(`${field}: must use https`)
  return value
}
// Absent text is null and absent lists are [], matching legalaimcp.catalog_claims() on a stored row and the
// existing records. An empty string would hash differently and would also count as an MCP claim in the trigger.
const absent = (value) => value === undefined || value === null || value === ''

function normalizeListing(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) refuse('listing: must be an object')
  const out = {
    name: boundedText(raw.name, 'name', 2, 100, { noMarkup: true }),
    tagline: boundedText(raw.tagline, 'tagline', 10, 120, { noMarkup: true }),
    description: boundedText(raw.description, 'description', 50, 2000),
    category: CATEGORIES.includes(raw.category) ? raw.category : refuse(`category: must be one of ${CATEGORIES.join(', ')}`),
    external_url: httpsUrl(raw.external_url, 'external_url'),
    pricing_model: PRICING.includes(raw.pricing_model) ? raw.pricing_model : refuse(`pricing_model: must be one of ${PRICING.join(', ')}`),
    creator_name: boundedText(raw.creator_name, 'creator_name', 2, 100, { noMarkup: true }),
  }
  for (const field of OPTIONAL_TEXT) out[field] = absent(raw[field]) ? null : boundedText(raw[field], field, 1, 2000)
  for (const field of OPTIONAL_URL) out[field] = absent(raw[field]) ? null : httpsUrl(raw[field], field)
  for (const field of ['tags', 'firm_size_fit']) {
    const list = raw[field] ?? []
    if (!Array.isArray(list) || list.length > 20) refuse(`${field}: must be a list of at most 20 items`)
    list.forEach((item, i) => boundedText(item, `${field}[${i}]`, 1, 60, { noMarkup: true }))
    if (new Set(list).size !== list.length) refuse(`${field}: duplicate entries`)
    if (field === 'firm_size_fit' && list.some((v) => !FIRM_SIZES.includes(v))) refuse(`firm_size_fit: must use ${FIRM_SIZES.join(', ')}`)
    out[field] = [...list]
  }
  return out
}

function submissionIds(raw, seen) {
  if (!Array.isArray(raw) || !raw.length || raw.length > 20) refuse('submission_ids: 1 to 20 ids required')
  return raw.map((id) => {
    if (typeof id !== 'string' || !UUID.test(id)) refuse(`submission_ids: not a uuid: ${String(id).slice(0, 40)}`)
    const key = id.toLowerCase()
    if (seen.has(key)) refuse(`duplicate submission id ${key}`)
    seen.add(key)
    return key
  })
}

function staticSources(raw, gate) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 5) refuse('sources: 1 to 5 primary sources required')
  return raw.map((source, i) => {
    if (!source || !['vendor', 'maintainer'].includes(source.kind)) refuse(`sources[${i}].kind: must be vendor or maintainer`)
    try { gate.primarySourceUrl(source.url) } catch { refuse(`sources[${i}].url: not a valid public https source`) }
    cleanText(source.quote, `sources[${i}].quote`)
    if (gate.normalize(source.quote).length < 15) refuse(`sources[${i}].quote: needs at least 15 characters after normalization`)
    return { url: source.url, kind: source.kind, quote: source.quote }
  })
}

const errorText = (e) => (e instanceof Refusal || String(e?.message).startsWith('Publication blocked')) ? e.message : `source fetch failed: ${String(e?.message ?? e).slice(0, 160)}`

/**
 * Check a reviewed admission plan. Returns one result per item plus the built records.
 * @param {any} plan
 * @param {{gate:any, policy:{reviews:any[],blocked_slugs:string[],blocked_domains:string[]}, fetcher?:typeof fetch, fetchSources?:boolean, now?:Date}} options
 */
export async function checkPlan(plan, { gate, policy, fetcher = fetch, fetchSources = true, now = new Date() }) {
  const results = [], admits = [], rejects = []
  const fail = (reason) => ({ ok: false, results: [{ kind: 'plan', label: 'plan', ok: false, reason }], admits, rejects, fetched: fetchSources })
  if (!plan || typeof plan !== 'object') return fail('plan: must be a JSON object')
  const admitItems = plan.admit ?? [], rejectItems = plan.reject ?? []
  if (!Array.isArray(admitItems) || !Array.isArray(rejectItems)) return fail('plan: admit and reject must be lists')
  if (!admitItems.length && !rejectItems.length) return fail('plan: nothing to admit or reject')
  if (admitItems.length + rejectItems.length > 100) return fail('plan: at most 100 items')
  if (typeof plan.reviewed_at !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(plan.reviewed_at) || new Date(`${plan.reviewed_at}T00:00:00Z`).toISOString?.().slice(0, 10) !== plan.reviewed_at) return fail('reviewed_at: must be a real YYYY-MM-DD date')
  try { boundedText(plan.reviewer, 'reviewer', 2, 200) } catch (e) { return fail(e.message) }

  const seenIds = new Set(), seenSlugs = new Set(), seenKeys = new Set()
  // Bodies fetched once per run; the final gate pass re-reads the same bytes instead of hitting the vendor twice.
  const bodies = new Map()
  const cachedFetch = async (url, init) => bodies.has(String(url)) ? new Response(bodies.get(String(url))) : fetcher(url, init)

  for (const item of admitItems) {
    const label = item?.listing?.name ? `admit ${String(item.listing.name).slice(0, 60)}` : 'admit'
    try {
      const ids = submissionIds(item?.submission_ids, seenIds)
      const listing = normalizeListing(item.listing)
      const slug = gate.generateSlug(listing.name)
      if (!slug) refuse('slug: the name produces an empty slug')
      if (item.listing.slug !== undefined && item.listing.slug !== slug) refuse(`slug: listing.slug ${item.listing.slug} differs from the admin rule result ${slug}`)
      if (seenSlugs.has(slug)) refuse(`duplicate slug ${slug}`)
      seenSlugs.add(slug)
      // Claude Sonnet 5.5, 2026-11-22: two admits for one site (or one repo) in a plan are refused.
      const key = siteKey(listing.external_url)
      if (seenKeys.has(key)) refuse(`another admit in this plan already points at ${key}`)
      seenKeys.add(key)
      if (policy.blocked_slugs.includes(slug)) refuse(`blocked slug ${slug}`)
      for (const field of ['external_url', 'mcp_repo_url', 'creator_url']) {
        if (listing[field] && policy.blocked_domains.some((d) => { const h = new URL(listing[field]).hostname.toLowerCase(); return h === d || h.endsWith(`.${d}`) })) refuse(`blocked domain in ${field}`)
      }
      const claims = gate.catalogClaims({ ...listing, slug })
      if (gate.isCatalogQuarantined(claims)) refuse('blocked slug or blocked domain in the checked-in registry')
      if (item.identity_confirmed !== true || item.capabilities_confirmed !== true) refuse('identity_confirmed and capabilities_confirmed must both be true')
      if (typeof item.mcp_confirmed !== 'boolean') refuse('mcp_confirmed: must be true or false')
      const sources = staticSources(item.sources, gate)
      const listing_sha256 = gate.catalogFingerprint(claims)
      const existing = policy.reviews.find((r) => r.slug === slug)
      // host carries the site key (host, or host/owner/repo on shared code hosts), not the bare host.
      const admit = { slug, host: siteKey(listing.external_url), submission_ids: ids, listing: claims, listing_sha256, record: null, recorded: false, note: `Admitted as /servers/${slug} after primary-source review ${plan.reviewed_at}.` }
      if (!fetchSources) {
        if (existing && existing.listing_sha256 !== listing_sha256) refuse(`slug ${slug} already has a review record with different claims`)
        admit.recorded = Boolean(existing)
        admits.push(admit)
        results.push({ kind: 'admit', label: `admit ${slug}`, ok: true, reason: 'ok (static checks only; sources not fetched)' })
        continue
      }
      const reviewed = []
      for (const source of sources) {
        const text = await gate.readPrimarySource(gate.primarySourceUrl(source.url), fetcher)
        bodies.set(String(gate.primarySourceUrl(source.url)), text)
        if (!gate.normalize(text).includes(gate.normalize(source.quote))) refuse(`supporting quote is absent from ${source.url}`)
        reviewed.push({ url: source.url, kind: source.kind, sha256: gate.sourceFingerprint(text), quote: source.quote })
      }
      // Key order matches every existing record in lib/catalog-reviews.json.
      const record = { slug, decision: 'approved', reviewed_at: plan.reviewed_at, reviewer: plan.reviewer, identity_confirmed: true, capabilities_confirmed: true, mcp_confirmed: item.mcp_confirmed, sources: reviewed, listing_sha256, claims }
      if (existing && !isDeepStrictEqual(existing, record)) refuse(`slug ${slug} already has a review record`)
      // The real gate, against a policy that includes this record: what this tool accepts, the gate accepts.
      await gate.assertCatalogReview(claims, { reviews: [record, ...policy.reviews.filter((r) => r.slug !== slug)], fetcher: cachedFetch, now })
      admits.push({ ...admit, record, recorded: Boolean(existing) })
      results.push({ kind: 'admit', label: `admit ${slug}`, ok: true, reason: existing ? 'ok (matches the checked-in record)' : 'ok' })
    } catch (e) {
      results.push({ kind: 'admit', label, ok: false, reason: errorText(e) })
    }
  }
  for (const item of rejectItems) {
    try {
      const ids = submissionIds(item?.submission_ids, seenIds)
      const notes = boundedText(typeof item.notes === 'string' ? item.notes.trim() : item.notes, 'notes', 3, 1000)
      rejects.push({ submission_ids: ids, notes })
      results.push({ kind: 'reject', label: `reject ${ids.join(',')}`, ok: true, reason: 'ok' })
    } catch (e) {
      results.push({ kind: 'reject', label: 'reject', ok: false, reason: errorText(e) })
    }
  }
  return { ok: results.every((r) => r.ok), results, admits, rejects, fetched: fetchSources, reviewed_at: plan.reviewed_at }
}

export const formatResults = (checked) => checked.results.map((r) => `${r.ok ? 'PASS' : 'FAIL'} ${r.label}: ${r.reason}`)

/**
 * Keep SQL pure ASCII: every non-ASCII UTF-16 unit becomes \uXXXX inside the JSON text, so astral
 * characters become surrogate pairs that PostgreSQL jsonb decodes back to the original character.
 * NUL is refused because jsonb cannot store it.
 */
export function escapeJsonAscii(json) {
  if (/(?<!\\)(?:\\\\)*\\u0000/.test(json)) throw Error('NUL character cannot be stored in jsonb')
  if (/[\u0080-\u009f]/.test(json)) throw Error('C1 control character in data')
  const out = json.replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
  if (!/^[\x20-\x7e]*$/.test(out)) throw Error('Escaped JSON is not printable ASCII')
  return out
}

const LISTING_COLUMNS = ['slug', 'name', 'tagline', 'description', 'category', 'external_url', 'mcp_repo_url', 'mcp_install_command', 'pricing_model', 'pricing_details', 'tags', 'creator_name', 'creator_url', 'logo_url', 'firm_size_fit']
const listingValue = (col) => ({
  category: `(l->>'category')::legalaimcp.listing_category`,
  pricing_model: `(l->>'pricing_model')::legalaimcp.pricing_model`,
  tags: `array(select e from jsonb_array_elements_text(l->'tags') with ordinality as t(e, i) order by i)`,
  firm_size_fit: `array(select e from jsonb_array_elements_text(l->'firm_size_fit') with ordinality as t(e, i) order by i)`,
}[col] ?? `l->>'${col}'`)

/**
 * Build guard.sql, apply.sql, apply.rollback.sql and readback.sql from a fully passing, fetched check.
 * All data rides in one jsonb literal under a random dollar tag that is absent from the data.
 * @param {any} checked
 * @param {{random?:()=>string}} options
 */
export function buildSQL(checked, { random = () => randomBytes(8).toString('hex') } = {}) {
  if (!checked?.ok || !checked.fetched || checked.admits.some((a) => !a.record)) throw Error('SQL is written only after a full passing check with sources fetched')
  const fields = gateFields(checked)
  const data = escapeJsonAscii(JSON.stringify({
    admit: checked.admits.map((a) => ({ slug: a.slug, host: a.host, submission_ids: a.submission_ids, listing: a.listing, review: a.record, note: a.note })),
    reject: checked.rejects.map((r) => ({ submission_ids: r.submission_ids, notes: r.notes })),
  }))
  let dataTag; do { dataTag = `$admit_${random()}$` } while (data.includes(dataTag))
  let opTag; do { opTag = `$admit_op_${random()}$` } while (data.includes(opTag) || opTag.includes(dataTag) || dataTag.includes(opTag))
  if (!/^\$[a-z_][a-z0-9_]*\$$/.test(dataTag) || !/^\$[a-z_][a-z0-9_]*\$$/.test(opTag)) throw Error('Invalid dollar-quote tag')
  // Explicit column aliases (as ta(a)) so a->>'slug' always names the jsonb column, never a whole row.
  const literal = `${dataTag}${data}${dataTag}::jsonb`
  const ctes = `with payload as (select ${literal} as p),
admits as (select a->>'slug' as slug, a->>'host' as host from payload, jsonb_array_elements(p->'admit') as ta(a)),
wanted as (
  select x::uuid as id from payload, jsonb_array_elements(p->'admit') as ta(a), jsonb_array_elements_text(a->'submission_ids') as tx(x)
  union all
  select x::uuid from payload, jsonb_array_elements(p->'reject') as tr(r), jsonb_array_elements_text(r->'submission_ids') as ty(x)
)`
  const guard = `-- Claude Opus 5.5, 2026-11-22: read-only preflight for apply.sql. Every boolean must be true before applying.
${ctes},
found as (select w.id, s.status::text as status from wanted w left join legalaimcp.submissions s on s.id = w.id),
slug_taken as (select l.slug, l.status::text as status from legalaimcp.listings l join admits a on a.slug = l.slug),
host_taken as (select a.slug, l.slug as existing_slug, l.external_url from legalaimcp.listings l join admits a on ${SQL_SITE_KEY('l.external_url')} = a.host where l.status = 'published'),
ledger_taken as (select r.slug from legalaimcp.catalog_reviews r join admits a on a.slug = r.slug)
select
  not exists (select 1 from found where status is distinct from 'pending') as submissions_all_pending,
  not exists (select 1 from slug_taken) as slugs_free,
  not exists (select 1 from host_taken) as hosts_free,
  not exists (select 1 from ledger_taken) as ledger_free,
  (select count(*) from wanted) as submissions_expected,
  (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'status', status)), '[]'::jsonb) from found where status is distinct from 'pending') as submission_problems,
  (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from slug_taken t) as slug_conflicts,
  (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from host_taken t) as host_conflicts,
  (select coalesce(jsonb_agg(slug), '[]'::jsonb) from ledger_taken) as ledger_conflicts;
`
  const ids = `array(select jsonb_array_elements_text(item->'submission_ids')::uuid)`
  const body = `-- Claude Opus 5.5, 2026-11-22: admit reviewed submissions as new listings in one transaction.
-- Any failed guard or unexpected row count raises, and nothing is saved. Rows are only inserted or updated.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
do ${opTag}
declare
  payload jsonb := ${literal};
  item jsonb;
  l jsonb;
  ids uuid[];
  n bigint;
  touched bigint := 0;
  expected bigint := 0;
begin
  perform 1 from legalaimcp.submissions s where s.id in (
    select x::uuid from jsonb_array_elements(payload->'admit') as ta(a), jsonb_array_elements_text(a->'submission_ids') as tx(x)
    union all
    select x::uuid from jsonb_array_elements(payload->'reject') as tr(r), jsonb_array_elements_text(r->'submission_ids') as ty(x)
  ) for update;
  for item in select value from jsonb_array_elements(payload->'admit') union all select value from jsonb_array_elements(payload->'reject') loop
    ids := ${ids};
    select count(*) into n from legalaimcp.submissions where id = any(ids) and status = 'pending';
    if n <> cardinality(ids) then raise exception 'Admission refused: a submission is missing or no longer pending'; end if;
  end loop;
  for item in select value from jsonb_array_elements(payload->'admit') loop
    l := item->'listing';
    if l->>'slug' is distinct from item->>'slug' or item->'review'->>'slug' is distinct from item->>'slug'
      or legalaimcp.catalog_claims(l) <> item->'review'->'claims' then
      raise exception 'Admission refused: listing and review record disagree for %', item->>'slug';
    end if;
    if exists (select 1 from legalaimcp.listings where slug = item->>'slug') then raise exception 'Admission refused: slug % is taken', item->>'slug'; end if;
    if exists (select 1 from legalaimcp.catalog_reviews where slug = item->>'slug') then raise exception 'Admission refused: ledger row exists for %', item->>'slug'; end if;
    if exists (select 1 from legalaimcp.listings x where x.status = 'published' and ${SQL_SITE_KEY('x.external_url')} = item->>'host') then
      raise exception 'Admission refused: a published listing already points at %', item->>'host';
    end if;
  end loop;
  for item in select value from jsonb_array_elements(payload->'admit') loop
    l := item->'listing';
    ids := ${ids};
    insert into legalaimcp.catalog_reviews (slug, claims, reviewer, reviewed_at, evidence)
    values (item->>'slug', legalaimcp.catalog_claims(l), item->'review'->>'reviewer', (item->'review'->>'reviewed_at')::date, item->'review');
    get diagnostics n = row_count; touched := touched + n; expected := expected + 1;
    insert into legalaimcp.listings (${LISTING_COLUMNS.join(', ')}, source, status, verified)
    values (${LISTING_COLUMNS.map(listingValue).join(', ')}, 'submitted', 'published', false);
    get diagnostics n = row_count; touched := touched + n; expected := expected + 1;
    update legalaimcp.submissions set status = 'approved', notes = concat_ws(E'\\n', nullif(notes, ''), item->>'note') where id = any(ids) and status = 'pending';
    get diagnostics n = row_count; touched := touched + n; expected := expected + cardinality(ids);
  end loop;
  for item in select value from jsonb_array_elements(payload->'reject') loop
    ids := ${ids};
    update legalaimcp.submissions set status = 'rejected', notes = concat_ws(E'\\n', nullif(notes, ''), item->>'notes') where id = any(ids) and status = 'pending';
    get diagnostics n = row_count; touched := touched + n; expected := expected + cardinality(ids);
  end loop;
  if touched <> expected then raise exception 'Admission refused: changed % rows, expected %', touched, expected; end if;
  select count(*) into n from jsonb_array_elements(payload->'admit') as ta(a)
    join legalaimcp.listings x on x.slug = a->>'slug' and x.status = 'published' and x.verified = false and x.source = 'submitted'
    where legalaimcp.catalog_claims(to_jsonb(x)) = a->'review'->'claims';
  if n <> jsonb_array_length(payload->'admit') then raise exception 'Admission refused: % of % listings read back as reviewed', n, jsonb_array_length(payload->'admit'); end if;
end
${opTag};
`
  const readback = `-- Claude Opus 5.5, 2026-11-22: read back what apply.sql wrote. Save the result as JSON for --verify-readback.
${ctes}
select jsonb_build_object(
  'listings', (select coalesce(jsonb_agg(jsonb_build_object(${[...fields, 'status', 'verified', 'source'].map((f) => `'${f}', x.${f}`).join(', ')}) order by x.slug), '[]'::jsonb)
    from legalaimcp.listings x join admits a on a.slug = x.slug),
  'submissions', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'status', s.status, 'notes', s.notes) order by s.id), '[]'::jsonb)
    from legalaimcp.submissions s join wanted w on w.id = s.id)
) as readback;
`
  const files = { guard, apply: `${body}commit;\n`, rollback: `${body}rollback;\n`, readback }
  for (const [name, text] of Object.entries(files)) {
    if (!/^[\x09\x0a\x0d\x20-\x7e]*$/.test(text)) throw Error(`${name}.sql is not pure ASCII`)
    if (/\b(delete|drop|truncate)\b/i.test(text.split(literal).join(''))) throw Error(`${name}.sql would remove data`)
  }
  return { ...files, dataTag }
}

// The claim columns, in the order catalogClaims() emits them.
const gateFields = (checked) => Object.keys(checked.admits[0]?.listing ?? Object.fromEntries(LISTING_COLUMNS.map((c) => [c, null])))

/** Insert new records in slug order. Every other byte of the file stays the same. */
export function mergeRecords(text, records) {
  const policy = JSON.parse(text)
  if (JSON.stringify(policy, null, 2) + '\n' !== text) throw Error('lib/catalog-reviews.json is not in its usual 2-space format; refusing to rewrite it')
  for (const record of records) {
    if (policy.reviews.some((r) => r.slug === record.slug)) throw Error(`Refusing to overwrite: ${record.slug} already has a review record`)
    const at = policy.reviews.findIndex((r) => r.slug > record.slug)
    policy.reviews.splice(at === -1 ? policy.reviews.length : at, 0, record)
  }
  return JSON.stringify(policy, null, 2) + '\n'
}

/** Confirm readback.sql output: each new listing published with the reviewed claims, each submission moved. */
export function verifyReadback(checked, readback, gate) {
  let data = Array.isArray(readback) ? readback[0] : readback
  if (data && 'readback' in data) data = data.readback
  if (typeof data === 'string') data = JSON.parse(data)
  const problems = []
  if (!data || !Array.isArray(data.listings) || !Array.isArray(data.submissions)) return { ok: false, problems: ['readback: expected {listings, submissions}'] }
  for (const admit of checked.admits) {
    const row = data.listings.find((r) => r.slug === admit.slug)
    if (!row) { problems.push(`${admit.slug}: listing missing`); continue }
    if (row.status !== 'published') problems.push(`${admit.slug}: status ${row.status}, expected published`)
    if (row.verified !== false) problems.push(`${admit.slug}: verified should be false`)
    if (row.source !== 'submitted') problems.push(`${admit.slug}: source ${row.source}, expected submitted`)
    if (gate.catalogFingerprint(row) !== admit.listing_sha256) problems.push(`${admit.slug}: fingerprint differs from the review record`)
  }
  const expect = [...checked.admits.flatMap((a) => a.submission_ids.map((id) => [id, 'approved'])), ...checked.rejects.flatMap((r) => r.submission_ids.map((id) => [id, 'rejected']))]
  for (const [id, status] of expect) {
    const row = data.submissions.find((s) => String(s.id).toLowerCase() === id)
    if (!row) problems.push(`${id}: submission missing`)
    else if (row.status !== status) problems.push(`${id}: expected ${status}, found ${row.status}`)
  }
  return { ok: problems.length === 0, problems }
}
