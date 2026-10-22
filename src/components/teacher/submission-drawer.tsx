'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Portal } from '@/components/shared/portal'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { EvaluationForm } from '@/app/(teacher)/teacher/tests/[id]/submissions/[submissionId]/evaluation-form'

interface SubmissionData {
  submission: any
  questions: any[]
  answers: any[]
}

interface SubmissionDrawerProps {
  testId: string
  submissionId: string
  studentName: string
  testTitle: string
  label: string
}

/** Wide right-hand drawer that opens the view/evaluate screen in place of a separate page. */
export function SubmissionDrawer({ testId, submissionId, studentName, testTitle, label }: SubmissionDrawerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  const [data, setData] = useState<SubmissionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  if (open && !mounted) setMounted(true)
  const visible = open && entered

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(id)
    }
    const t = setTimeout(() => { setEntered(false); setMounted(false) }, 300)
    return () => clearTimeout(t)
  }, [open])

  // Load fresh data every time the drawer opens so marks are never stale.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setData(null)
    setError(null)
    const supabase = createClient()
    Promise.all([
      supabase.from('submissions').select('*, student:profiles(full_name, email), test:tests(title, pass_mark)').eq('id', submissionId).single(),
      supabase.from('questions').select('*').eq('test_id', testId).order('order_index'),
      supabase.from('answers').select('*').eq('submission_id', submissionId),
    ]).then(([sub, q, a]) => {
      if (cancelled) return
      if (!sub.data) setError('Could not load this submission.')
      else setData({ submission: sub.data, questions: q.data ?? [], answers: a.data ?? [] })
    })
    return () => { cancelled = true }
  }, [open, testId, submissionId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty])

  function close() {
    setOpen(false)
    // Pick up status/score changes in the list behind the drawer.
    if (dirty) { setDirty(false); router.refresh() }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>{label}</Button>

      {mounted && (
        <Portal>
          <div
            className={cn('fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300', visible ? 'opacity-100' : 'opacity-0')}
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${label} submission`}
            className={cn(
              'fixed top-0 right-0 h-full w-full max-w-[1040px] bg-background z-[61]',
              'flex flex-col border-l border-border shadow-2xl',
              'transition-transform duration-300 ease-in-out',
              visible ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="min-w-0">
                <h2 className="text-base font-semibold">{label === 'Evaluate' ? 'Evaluate submission' : 'Submission'}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{studentName} — {testTitle}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {error ? (
                <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
              ) : !data ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <EvaluationForm
                  embedded
                  testId={testId}
                  submissionId={submissionId}
                  initialSubmission={data.submission}
                  initialQuestions={data.questions}
                  initialAnswers={data.answers}
                  onChange={() => setDirty(true)}
                />
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
