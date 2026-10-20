// classification: PUBLIC
import evidence from './software-connections.json'
/** Manually reviewed primary-source setup evidence, not a live compatibility test. */
export interface SoftwareConnection {
  slugs: readonly string[]
  name: string
  kind: 'official' | 'community'
  workflow: string
  requirements: string
  permissions: string
  setup: string
  source: string
  sourceLabel: string
  reviewed: string
}

export const SOFTWARE_CONNECTIONS: readonly SoftwareConnection[] = evidence.connections.map(connection => {
  if (connection.kind !== 'official' && connection.kind !== 'community') throw new Error('Invalid software connection kind')
  return { ...connection, kind: connection.kind }
})

export function getSoftwareConnection(slug: string): SoftwareConnection | undefined {
  return SOFTWARE_CONNECTIONS.find(connection => connection.slugs.includes(slug))
}
