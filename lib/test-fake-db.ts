// Claude Fable 5.2 (executor), 2026-11-15: tiny chainable Supabase fake shared by the featured-recovery route tests; records every write so tests can assert exactly what was stored.
type Result = { data: unknown; error: unknown }
export type Op = { table: string; op: 'select' | 'insert' | 'update'; payload?: Record<string, unknown>; filters: Array<[string, string, unknown]> }

export function makeFakeDb(handler: (op: Op) => Result | undefined) {
  const ops: Op[] = []
  const from = (table: string) => {
    const cur: Op = { table, op: 'select', filters: [] }
    const run = async (): Promise<Result> => {
      ops.push({ ...cur, filters: [...cur.filters] })
      return handler(cur) ?? { data: null, error: null }
    }
    const b: Record<string, unknown> = {
      select: () => b,
      insert: (p: Record<string, unknown>) => { cur.op = 'insert'; cur.payload = p; return b },
      update: (p: Record<string, unknown>) => { cur.op = 'update'; cur.payload = p; return b },
      eq: (f: string, v: unknown) => { cur.filters.push(['eq', f, v]); return b },
      neq: (f: string, v: unknown) => { cur.filters.push(['neq', f, v]); return b },
      or: (v: string) => { cur.filters.push(['or', '', v]); return b },
      single: run,
      maybeSingle: run,
      // awaiting the builder directly (update without .single) runs it
      then: (res: (r: Result) => unknown, rej?: (e: unknown) => unknown) => run().then(res, rej),
    }
    return b
  }
  return { db: { from } as never, ops }
}
