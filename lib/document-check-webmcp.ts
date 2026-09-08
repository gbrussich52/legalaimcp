import { documentCheckInputJsonSchema, type DocumentCheckResult } from './document-check'

export type RegistrationStatus = 'disabled' | 'unavailable' | 'registered' | 'error'
export type ModelContext = {
  registerTool: (tool: {
    name: string
    title: string
    description: string
    inputSchema: unknown
    annotations: { readOnlyHint: boolean; consequentialHint: boolean; untrustedContentHint: boolean }
    execute: (input: unknown, options?: { signal?: AbortSignal }) => Promise<string>
  }, options: { signal: AbortSignal }) => Promise<void> | void
}

/** Chrome imperative API, verified 2026-09-08. No backend or current-form reader. */
export async function registerDocumentCheckTool(context: ModelContext | undefined, execute: (input: unknown) => DocumentCheckResult, signal: AbortSignal): Promise<RegistrationStatus> {
  if (!context || typeof context.registerTool !== 'function') return 'unavailable'
  if (signal.aborted) return 'disabled'
  try {
    await context.registerTool({
      name: 'check_document_metadata',
      title: 'Check a requested document list against supplied metadata',
      description: 'Compare explicitly supplied fictional or redacted document metadata against a supplied checklist. Displays inputs and findings on this page. Does not read existing form fields, upload documents, extract file content, contact clients, or establish legal sufficiency. Optional expectations that are omitted are not checked.',
      inputSchema: documentCheckInputJsonSchema,
      annotations: { readOnlyHint: true, consequentialHint: false, untrustedContentHint: true },
      execute: async (input, options = {}) => {
        if (signal.aborted || options.signal?.aborted) throw new Error('Document check cancelled.')
        return JSON.stringify(execute(input))
      },
    }, { signal })
    return signal.aborted ? 'disabled' : 'registered'
  } catch { return 'error' }
}
