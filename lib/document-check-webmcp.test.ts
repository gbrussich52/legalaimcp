import { describe, it, expect } from 'vitest'
import { registerDocumentCheckTool, type ModelContext } from './document-check-webmcp'
import { reconcileDocuments, DOCUMENT_CHECK_EXAMPLE } from './document-check'

describe('opt-in document WebMCP adapter', () => {
 it('keeps unsupported browsers usable through the manual form',async()=>{
  expect(await registerDocumentCheckTool(undefined,reconcileDocuments,new AbortController().signal)).toBe('unavailable')
 })
 it('registers only explicit inputs and calls the same checker',async()=>{
  let tool:Parameters<ModelContext['registerTool']>[0]|undefined
  let signal:AbortSignal|undefined
  const controller=new AbortController()
  const context:ModelContext={registerTool:(definition,options)=>{tool=definition;signal=options.signal}}
  expect(await registerDocumentCheckTool(context,reconcileDocuments,controller.signal)).toBe('registered')
  expect(signal).toBe(controller.signal)
  expect(tool!.name).toBe('check_document_metadata')
  expect(JSON.parse(await tool!.execute(DOCUMENT_CHECK_EXAMPLE))).toEqual(reconcileDocuments(DOCUMENT_CHECK_EXAMPLE))
  expect(tool!.annotations.untrustedContentHint).toBe(true)
  await expect(tool!.execute({})).rejects.toThrow()
  controller.abort()
  await expect(tool!.execute(DOCUMENT_CHECK_EXAMPLE)).rejects.toThrow('cancelled')
 })
 it('does not register an already disabled tool',async()=>{
  let called=false
  const controller=new AbortController();controller.abort()
  expect(await registerDocumentCheckTool({registerTool:()=>{called=true}},reconcileDocuments,controller.signal)).toBe('disabled')
  expect(called).toBe(false)
 })
 it('reports registration errors and respects per-call cancellation',async()=>{
  expect(await registerDocumentCheckTool({registerTool:()=>{throw new Error('Denied')}},reconcileDocuments,new AbortController().signal)).toBe('error')
  let tool:Parameters<ModelContext['registerTool']>[0]|undefined
  await registerDocumentCheckTool({registerTool:t=>{tool=t}},()=>{throw new Error('Should not run')},new AbortController().signal)
  const controller=new AbortController();controller.abort()
  await expect(tool!.execute(DOCUMENT_CHECK_EXAMPLE,{signal:controller.signal})).rejects.toThrow('cancelled')
 })
})
