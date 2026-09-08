/** Public planning templates, not vendor compatibility or legal advice. */
export const WORKFLOWS = {
  intake: {
    label: 'Intake follow-up',
    outcome: 'Give every new inquiry a clear next step.',
    category: 'client-communication',
    baseline: 'Measure time from inquiry to first response, follow-up completion, and booked consultations.',
    steps: ['Record an inquiry in the existing intake system.', 'Draft an acknowledgment and flag missing information.', 'Have a staff member approve the response and next task.'],
    boundary: 'A lawyer handles conflict clearance and acceptance of a new client. Do not automate either decision.',
    acceptance: 'Use 10 fictional inquiries, including duplicates and missing fields. Each must reach the right reviewer once, with no unapproved messages sent.',
  },
  documents: {
    label: 'Document collection',
    outcome: 'See which documents are missing before chasing them.',
    category: 'document-processing',
    baseline: 'Measure staff minutes spent checking and chasing a complete document set.',
    steps: ['Start with a firm-approved document checklist.', 'Match received files to checklist items and flag uncertainty.', 'Draft a missing-document request for staff approval.'],
    boundary: 'Keep files in approved storage. A person verifies completeness and every recipient before anything is sent.',
    acceptance: 'Use 10 fictional document sets with duplicates, misnamed files, and missing items. Flag every missing item without treating uncertain matches as complete.',
  },
  billing: {
    label: 'Billing preparation',
    outcome: 'Spend less time assembling a draft invoice.',
    category: 'billing-time',
    baseline: 'Measure staff minutes preparing and correcting each draft invoice, separately from collected fees.',
    steps: ['Use approved time entries from the existing billing system.', 'Group entries and draft descriptions without inventing work or time.', 'Have the responsible person review the draft before posting.'],
    boundary: 'No automatic invoice posting, trust-account changes, or invented time entries. Keep the original records.',
    acceptance: 'Use 10 fictional invoices, including missing rates and duplicate entries. Totals must reconcile exactly; unresolved items must be flagged.',
  },
} as const

export type Workflow = keyof typeof WORKFLOWS
export const SYSTEMS = ['Clio', 'MyCase', 'Filevine', 'PracticePanther', 'Other / not sure'] as const
export const SUPPORT_LEVELS = ['I can configure tools', 'I need setup help'] as const

export function systemAdvice(system: typeof SYSTEMS[number]) {
  return system === 'Other / not sure'
    ? 'Inventory your current software and built-in automation first. Ask the vendor about exports, permissions, and supported integrations before buying anything.'
    : `Check your ${system} plan for built-in automation first. Confirm API access, required permissions, and vendor-supported integrations. Selecting it here does not confirm MCP compatibility.`
}

/** Capacity estimate, never a revenue forecast. Null for invalid or incomplete inputs. */
export function estimateCapacity(tasks: number, before: number, after: number) {
  if (![tasks, before, after].every(Number.isFinite) || tasks <= 0 || tasks > 10000 || !Number.isInteger(tasks) || before <= 0 || before > 1440 || after < 0 || after > 1440) return null
  const monthlyHours = tasks * (before - after) / 60
  return { monthlyHours, improved: monthlyHours > 0 }
}
