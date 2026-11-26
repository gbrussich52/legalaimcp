// Claude Sonnet 5.5, 2026-11-23: the words on /how-we-verify, kept in one place so the page and its FAQPage schema
// cannot drift apart and a test can read them. No claim here says how often checks are re-run: no scheduled job
// exists yet. The page says only that each listing shows the date of its last check.
import { CHECK_LABELS } from './verification'

export type CheckMethod = { id: string; label: string; shows: string; doesNotShow: string; howToRepeat: string }

/** One row per check a listing can show. security_resolver is an internal alert and is never shown on a listing, so it is not here. */
export const CHECK_METHODS: CheckMethod[] = [
  {
    id: 'site',
    label: CHECK_LABELS.site,
    shows: 'The vendor’s web address answered a request on the date we looked.',
    doesNotShow: 'That the product works, or who runs it.',
    howToRepeat: "curl -sL -o /dev/null -w '%{http_code} %{url_effective}\\n' --max-redirs 5 https://example.com/",
  },
  {
    id: 'domain_age',
    label: CHECK_LABELS.domain_age,
    shows: 'When the domain name was first registered, as the public registry (RDAP) records it. A new name is a reason to look closer.',
    doesNotShow: 'Who owns the name, or whether the business is any good. Domain age shows when a name was registered, not who owns it.',
    howToRepeat: 'curl -sL https://rdap.org/domain/example.com',
  },
  {
    id: 'mail',
    label: CHECK_LABELS.mail,
    shows: 'The domain has mail (MX) records, so it is set up to receive email.',
    doesNotShow: 'That anyone reads or answers that mail.',
    howToRepeat: "curl -s 'https://dns.google/resolve?name=example.com&type=MX'",
  },
  {
    id: 'mcp_endpoint',
    label: CHECK_LABELS.mcp_endpoint,
    shows: 'The MCP address on the listing answers the standard opening call (initialize) and names the server and its version, or asks for sign-in.',
    doesNotShow: 'That its tools work, or what they do with your data.',
    howToRepeat: `curl -s -X POST 'https://example.com/mcp' -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"listing-review","version":"1.0"}}}'`,
  },
  {
    id: 'repo',
    label: CHECK_LABELS.repo,
    shows: 'A public GitHub repository with that name exists, whether it is archived, and the date of its last push.',
    doesNotShow: 'That the code is sound, or that it is the code the vendor runs.',
    howToRepeat: 'curl -s https://api.github.com/repos/OWNER/REPO',
  },
  {
    id: 'registry',
    label: CHECK_LABELS.registry,
    shows: 'An entry in the official MCP registry matches the listing, and the date it was published.',
    doesNotShow: 'Quality. A registry entry shows control of a namespace, not quality.',
    howToRepeat: "curl -s 'https://registry.modelcontextprotocol.io/v0.1/servers?search=NAME'",
  },
]

export const OPERATOR_METHOD = {
  label: 'Company register',
  shows: 'A company by that name is listed in a public company register, with the status shown on the date we looked.',
  doesNotShow: 'That the company is the one behind this product, or that it is in good standing today.',
  howToRepeat: 'Search the register named on the listing for the operator’s name.',
}

export const PAID_SENTENCE = 'A paid placement changes where a listing appears, not what we check. Paid listings are marked Sponsored.'

export const FAQS: { q: string; a: string }[] = [
  { q: 'Is LegalAIMCP the vendor of the tools it lists?', a: 'No. LegalAIMCP is an independent directory. We do not make, sell or run the tools we list.' },
  { q: 'Does a passing check mean you recommend a tool?', a: 'No. A passing check shows what we saw on one date. We did not open a customer account, use the product on a real matter, test its security, or check any legal output for accuracy.' },
  { q: 'Can I repeat the checks without LegalAIMCP?', a: 'Yes. Each listing shows a command for each check. Run it in a terminal, or open the address it names, and compare what you see with what we wrote.' },
  { q: 'What does Could not check mean?', a: 'We could not run that check on the date shown, for example because a site blocks automated readers. It means we do not know. It does not mean the check failed.' },
  { q: 'What does an entry in the official MCP registry show?', a: 'It shows control of a namespace. It does not show quality.' },
  { q: 'Does paying change what you check?', a: PAID_SENTENCE },
  { q: 'How do I report an error?', a: 'Write to hello@legalaimcp.com. Say which listing and which line is wrong.' },
]
