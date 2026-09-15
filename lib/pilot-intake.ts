// classification: PUBLIC
import { z } from 'zod'

export const PILOT_CONSENT_VERSION = '2026-09-14'
export const PILOT_STATUSES = ['new', 'reviewing', 'scoped', 'closed'] as const
export type PilotStatus = typeof PILOT_STATUSES[number]
const text = (min: number, max: number) => z.string().trim().min(min).max(max)

function endpointAllowed(value: string) {
  if (!value) return true
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash &&
      u.hostname.includes('.') && !/^[\d.]+$/.test(u.hostname) && !u.hostname.startsWith('[') &&
      !/\.(localhost|local|internal)$/.test(u.hostname)
  } catch { return false }
}

export const pilotSchema = z.object({
  requestId: z.string().uuid(),
  name: text(2, 80),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  organization: text(2, 120),
  workflow: text(20, 1000),
  endpoint: text(0, 300).refine(endpointAllowed, 'Use an HTTPS domain without credentials, query parameters or fragments, or leave it blank.'),
  access: z.enum(['public', 'authenticated', 'not_ready']),
  readOnly: z.enum(['yes', 'no', 'unsure']),
  sampleInput: text(5, 600),
  expectedResult: text(10, 600),
  failureExample: text(10, 600),
  pricingInterest: z.enum(['yes', 'discuss']),
  consent: z.literal(true, { error: 'Please agree to contact about this pilot request.' }),
  synthetic: z.literal(true, { error: 'Please confirm the examples are fictional and contain no client data or credentials.' }),
  source: z.enum(['pilot', 'mcp', 'workflow_plan', 'directory']),
})

export type PilotInput = z.infer<typeof pilotSchema>
export type PilotState = { success: boolean; error: string | null; receipt?: string; qualification?: 'standard' | 'needs_scope' }

export function qualifyPilot(input: PilotInput): { fit: 'standard' | 'needs_scope'; reasons: string[] } {
  const reasons: string[] = []
  if (input.access !== 'public') reasons.push('Access setup needs review before a monitoring pilot can be scoped.')
  if (!input.endpoint) reasons.push('An existing integration endpoint still needs to be identified.')
  if (input.readOnly !== 'yes') reasons.push('The initial pilot covers checks that do not change data or send messages.')
  if (input.pricingInterest !== 'yes') reasons.push('Confirm the price and scope before paid work begins.')
  return { fit: reasons.length ? 'needs_scope' : 'standard', reasons: reasons.length ? reasons : ['Your answers fit the proposed scope. Endpoint permission and check behavior still need review.'] }
}

export function buildPilotBrief(input: PilotInput): string {
  const qualification = qualifyPilot(input)
  return [
    'LegalAIMCP — proposed workflow monitoring pilot',
    `Draft reference: ${input.requestId}`,
    'A downloaded draft is not a submitted request or an active service.',
    '', `Organization: ${input.organization}`, `Workflow: ${input.workflow}`,
    `Endpoint (not contacted): ${input.endpoint || 'To be identified'}`,
    `Access: ${input.access}`, `Read-only checks: ${input.readOnly}`,
    '', 'Fictional input', input.sampleInput,
    '', 'Expected result', input.expectedResult,
    '', 'Example that should fail', input.failureExample,
    '', 'Initial scope review', ...qualification.reasons,
    '', 'Proposed offer: $250 setup + $149 for the first month; scope and fees agreed before work.',
    'One existing integration, up to five read-only checks, four-week pilot.',
    'No legal advice, unlimited remediation or 24/7 response guarantee.',
    'Customer confirms the business rule; operator verifies endpoint ownership, permissions and good/bad test cases before enabling checks.',
    'No tool execution, payment or email delivery is triggered by generating this brief.',
  ].join('\n')
}

export const pilotReviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(PILOT_STATUSES),
  supportMinutes: z.preprocess(value => value === '' || value === null ? null : value, z.coerce.number().int().min(0).max(100000).nullable()),
})
