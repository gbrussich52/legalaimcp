'use client'

import { useEffect, useRef, useState } from 'react'
import { parseDocumentCheckInput, reconcileDocuments, type DocumentCheckInput, type DocumentCheckResult } from '@/lib/document-check'
import { registerDocumentCheckTool, type ModelContext, type RegistrationStatus } from '@/lib/document-check-webmcp'

/** Explicit-input tool only. Never exposes a getter for current form contents. */
export function useDocumentCheckWebMCP(enabled: boolean, onResult: (input: DocumentCheckInput, result: DocumentCheckResult) => void) {
  const callback = useRef(onResult)
  callback.current = onResult
  const [status, setStatus] = useState<RegistrationStatus>('disabled')
  useEffect(() => {
    if (!enabled) { setStatus('disabled'); return }
    const controller = new AbortController()
    const context = (document as Document & { modelContext?: ModelContext }).modelContext
    registerDocumentCheckTool(context, (value) => {
      if (controller.signal.aborted) throw new Error('The demo tool is no longer enabled.')
      const input = parseDocumentCheckInput(value)
      const result = reconcileDocuments(input)
      callback.current(input, result)
      return result
    }, controller.signal).then(next => { if (!controller.signal.aborted) setStatus(next) })
    return () => controller.abort()
  }, [enabled])
  return status
}
