import { DatabaseZap } from 'lucide-react'

/** True when a query failed only because the assignments migration has not been applied yet. */
export function isMissingTable(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /schema cache|does not exist/i.test(error.message ?? '')
}

export function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-card border border-dashed border-border-strong bg-card px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
        <DatabaseZap className="size-6 text-primary-text" />
      </div>
      <h2 className="text-lg">One database step left</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Assignments need new tables. In the Supabase SQL editor, run{' '}
        <code className="font-mono font-semibold">supabase/migrations/2026-11-add-assignments.sql</code>, then reload this page.
      </p>
    </div>
  )
}
