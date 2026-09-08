'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { WORKFLOWS, SYSTEMS, SUPPORT_LEVELS, estimateCapacity, systemAdvice, type Workflow } from '@/lib/workflow-plan'

const field = 'block w-full mt-2 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-navy focus:outline-none focus:ring-2 focus:ring-gold-text'

export function WorkflowPlanner() {
  const [workflow, setWorkflow] = useState<Workflow>('intake')
  const [system, setSystem] = useState<typeof SYSTEMS[number]>('Clio')
  const [support, setSupport] = useState<typeof SUPPORT_LEVELS[number]>('I need setup help')
  const [plan, setPlan] = useState<{ workflow: Workflow; system: typeof SYSTEMS[number]; support: typeof SUPPORT_LEVELS[number] } | null>(null)
  const [tasks, setTasks] = useState('')
  const [before, setBefore] = useState('')
  const [after, setAfter] = useState('')
  const resultRef = useRef<HTMLHeadingElement>(null)
  const estimate = tasks !== '' && before !== '' && after !== '' ? estimateCapacity(Number(tasks), Number(before), Number(after)) : null
  const selected = plan ? WORKFLOWS[plan.workflow] : null

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (plan?.workflow !== workflow) {
      setTasks('')
      setBefore('')
      setAfter('')
    }
    setPlan({ workflow, system, support })
    requestAnimationFrame(() => resultRef.current?.focus())
  }

  return (
    <div className="mt-10 grid lg:grid-cols-[320px_1fr] gap-8 items-start">
      <form onSubmit={generate} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 print:hidden">
        <label className="block font-sans font-semibold text-sm">1. What takes too much time?
          <select className={field} value={workflow} onChange={(e) => setWorkflow(e.target.value as Workflow)}>
            {Object.entries(WORKFLOWS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select>
        </label>
        <label className="block font-sans font-semibold text-sm">2. What do you use today?
          <select className={field} value={system} onChange={(e) => setSystem(e.target.value as typeof system)}>
            {SYSTEMS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="block font-sans font-semibold text-sm">3. How will you set it up?
          <select className={field} value={support} onChange={(e) => setSupport(e.target.value as typeof support)}>
            {SUPPORT_LEVELS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <button className="btn-primary w-full" type="submit">Build my workflow plan →</button>
        <p className="text-xs text-charcoal/60">Your selections and estimates stay in this page. No client or firm details are collected here.</p>
      </form>

      {!selected || !plan ? (
        <section className="rounded-2xl border border-dashed border-slate-300 p-8 sm:p-10">
          <h2 className="font-display text-2xl text-navy font-semibold">A brief you can act on.</h2>
          <ul className="mt-5 space-y-4 text-charcoal/75">
            <li>One task and a clear starting point.</li>
            <li>What to check in your existing software.</li>
            <li>Where a person reviews the work.</li>
            <li>A small test before using real matters.</li>
          </ul>
          <p className="mt-8 text-sm text-charcoal/60">Save the result as a PDF, share it with your team, or bring it to a workflow assessment.</p>
        </section>
      ) : (
        <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-7" aria-label="Your workflow plan">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-gold-text">Your pilot brief · {plan.system}</p>
            <h2 ref={resultRef} tabIndex={-1} className="font-display text-3xl font-bold text-navy mt-3 focus:outline-none">{selected.outcome}</h2>
            <p className="mt-3 text-sm text-charcoal/60">{selected.label} · {plan.support}. Prepared in your browser; not reviewed by our team.</p>
          </div>
          <div><h3 className="font-semibold text-navy">Start with what you own</h3><p className="mt-2 text-charcoal/75">{systemAdvice(plan.system)}</p></div>
          <div><h3 className="font-semibold text-navy">A workflow to test</h3><ol className="list-decimal pl-5 mt-3 space-y-2">{selected.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
          <div className="bg-slate-50 border-l-4 border-gold-text p-4"><h3 className="font-semibold text-navy">Keep a person in control</h3><p className="mt-2 text-sm leading-relaxed">{selected.boundary}</p></div>
          <div><h3 className="font-semibold text-navy">How to know it works</h3><p className="mt-2 text-charcoal/75">{selected.acceptance}</p><p className="mt-3 text-charcoal/75">{selected.baseline} Agree the success threshold with your team before running the pilot.</p></div>
          <fieldset className="border-t border-slate-200 pt-6">
            <legend className="font-display text-xl font-semibold text-navy pt-6">Would it save enough time?</legend>
            <p className="text-sm text-charcoal/65 mt-2">Use your own estimates, including review and corrections. These numbers stay in your browser.</p>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <label className="text-sm">Tasks per month<input className={field} type="number" min="1" max="10000" step="1" value={tasks} onChange={(e) => setTasks(e.target.value)} /></label>
              <label className="text-sm">Minutes per task now<input className={field} type="number" min="0.1" max="1440" step="any" value={before} onChange={(e) => setBefore(e.target.value)} /></label>
              <label className="text-sm">Minutes with the pilot<input className={field} type="number" min="0" max="1440" step="any" value={after} onChange={(e) => setAfter(e.target.value)} /></label>
            </div>
            <p className="mt-4 text-navy font-semibold" role="status">
              {estimate ? estimate.improved ? `Estimated capacity freed: ${estimate.monthlyHours.toFixed(1)} hours per month.` : 'These estimates show no time saving. Simplify the pilot or choose a different task.' : 'Enter three valid estimates to calculate potential time savings.'}
            </p>
            <p className="text-xs text-charcoal/60 mt-2">Tasks × (minutes now − minutes with pilot) ÷ 60. Capacity is not revenue or cash savings. Software, setup, maintenance, and how you use the time determine the return.</p>
          </fieldset>
          <div className="border-t border-slate-200 pt-6 print:hidden">
            <h3 className="font-display text-xl font-semibold text-navy">{plan.support === 'I need setup help' ? 'Want help turning this into a working process?' : 'Ready to check the available tools?'}</h3>
            <p className="mt-2 text-sm text-charcoal/70">{plan.support === 'I need setup help' ? 'A NYClaw workflow assessment checks feasibility and gives you a written scope before any implementation.' : 'Use the directory to explore options, then confirm features and permissions with each vendor.'}</p>
            <div className="flex flex-wrap gap-4 mt-5 items-center">
              <Link href="/workflow-assessment" className="btn-primary">See the assessment →</Link>
              <Link href={`/categories/${selected.category}`} className="text-gold-text font-semibold underline">Explore relevant tools</Link>
              <button type="button" className="text-sm font-semibold underline py-3" onClick={() => window.print()}>Print / save PDF</button>
            </div>
          </div>
          <p className="text-xs text-charcoal/60">LegalAIMCP is operated by NYClaw, an implementation agency. This plan is software guidance, not legal advice or a compliance certification. Review dated vendor documentation and your firm’s requirements before connecting client data.</p>
        </section>
      )}
    </div>
  )
}
