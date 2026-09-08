import { NYCLAW_CALENDLY } from '@/lib/constants'

export function AssessmentBooking() {
  const href = `${NYCLAW_CALENDLY}?utm_source=legalaimcp&utm_medium=referral&utm_campaign=workflow_assessment`
  return <a href={href} target="_blank" rel="noopener noreferrer" className="btn-primary inline-block">Discuss my workflow →</a>
}
