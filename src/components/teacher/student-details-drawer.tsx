'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { getStudentAccessLink } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Portal } from '@/components/shared/portal'
import type { StudentTestEntry } from '@/components/teacher/student-types'
import { Loader2, Link2, Copy, Check, X, Search, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/** Slide-in drawer state: mounts on open, plays the slide, unmounts after the exit. */
export function useDrawerState(want: boolean) {
  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  if (want && !mounted) setMounted(true)
  useEffect(() => {
    if (want) {
      const id = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(id)
    }
    const t = setTimeout(() => { setEntered(false); setMounted(false) }, 300)
    return () => clearTimeout(t)
  }, [want])
  return { mounted, visible: want && entered }
}

export const drawerClass = (visible: boolean) => cn(
  'fixed top-0 right-0 h-full w-full max-w-[480px] bg-background z-[61]',
  'flex flex-col border-l border-border shadow-2xl',
  'transition-transform duration-300 ease-in-out motion-reduce:transition-none',
  visible ? 'translate-x-0' : 'translate-x-full',
)
export const backdropClass = (visible: boolean) => cn(
  'fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300',
  visible ? 'opacity-100' : 'opacity-0',
)


const STATE_ORDER = { to_grade: 0, in_progress: 1, not_started: 2, marked: 3 } as const

function TestStatus({ t }: { t: StudentTestEntry }) {
  if (t.state === 'marked' && t.total) {
    const pct = Math.round(((t.obtained ?? 0) / t.total) * 100)
    return (
      <span
        className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums"
        style={{ backgroundColor: `color-mix(in oklab, var(--primary) ${10 + Math.min(Math.max(pct, 0), 100) * 0.4}%, var(--card))` }}
      >
        {t.obtained}/{t.total} · {pct}%
      </span>
    )
  }
  if (t.state === 'to_grade') {
    return <span className="shrink-0 rounded-full border border-primary bg-card px-2 py-0.5 text-xs font-bold text-primary-text">To grade</span>
  }
  if (t.state === 'in_progress') {
    return <span className="shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">In progress</span>
  }
  return <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted-foreground">Not started</span>
}


interface StudentDetailsDrawerProps {
  studentId: string
  studentName: string
  addedDate: string
  yearLevel: string | null
  tests: StudentTestEntry[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Details are still being fetched: name is known, the rest shows a spinner. */
  loading?: boolean
}

/** Right-hand drawer with a student's tests, results and personal login link. */
export function StudentDetailsDrawer({
  studentId, studentName, addedDate, yearLevel, tests, open, onOpenChange, loading = false,
}: StudentDetailsDrawerProps) {
  const details = useDrawerState(open)
  const [studentLink, setStudentLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [testQuery, setTestQuery] = useState('')
  const [isLoadingLink, startLoadLink] = useTransition()

  const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const sorted = useMemo(() => {
    const q = testQuery.trim().toLowerCase()
    return tests
      .filter(t => !q || t.title.toLowerCase().includes(q))
      .sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))
  }, [tests, testQuery])

  const loadLink = () => {
    startLoadLink(async () => {
      const result = await getStudentAccessLink(studentId)
      if (result?.error) toast.error(result.error)
      else if (result?.accessToken) setStudentLink(`${window.location.origin}/s/${result.accessToken}`)
    })
  }

  const handleCopy = async () => {
    if (!studentLink) return
    await navigator.clipboard.writeText(studentLink)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {details.mounted && (
        <Portal>
          <div className={backdropClass(details.visible)} onClick={() => onOpenChange(false)} />
          <div className={drawerClass(details.visible)} role="dialog" aria-label={`${studentName} details`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold">Student details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Tests, results and login link</p>
              </div>
              <button type="button" onClick={() => onOpenChange(false)} aria-label="Close" className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary-text">{initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-tight">{studentName}</p>
                  {!loading && (
                    <>
                      <p className="text-sm text-muted-foreground">{yearLevel || 'No year set'}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(addedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <section aria-label="Tests" className="space-y-3">
                <h3 className="text-sm font-semibold">
                  Tests {!loading && <span className="font-medium tabular-nums text-muted-foreground">{tests.length}</span>}
                </h3>
                {loading ? (
                  <div className="flex h-24 items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : tests.length === 0 ? (
                  <p className="rounded-lg bg-surface px-3 py-4 text-sm text-muted-foreground">No tests assigned yet. Share an invite code or add this student to a test.</p>
                ) : (
                  <>
                    {tests.length > 6 && (
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={testQuery} onChange={e => setTestQuery(e.target.value)} placeholder="Search tests" aria-label="Search this student's tests" className="pl-8" />
                      </div>
                    )}
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {sorted.map((t, i) => {
                        const inner = (
                          <>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{t.title}</p>
                              {t.submittedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Handed in {new Date(t.submittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                            <TestStatus t={t} />
                            {t.submissionId && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
                          </>
                        )
                        return (
                          <li key={t.testId} style={{ '--i': i } as React.CSSProperties} className="rise-in">
                            {t.submissionId ? (
                              <Link href={`/teacher/tests/${t.testId}/submissions/${t.submissionId}`} className="flex items-center gap-3 px-3 py-2.5 outline-none transition-colors hover:bg-foreground/5 focus-visible:bg-foreground/5">
                                {inner}
                              </Link>
                            ) : (
                              <div className="flex items-center gap-3 px-3 py-2.5">{inner}</div>
                            )}
                          </li>
                        )
                      })}
                      {sorted.length === 0 && <li className="px-3 py-4 text-sm text-muted-foreground">No tests match.</li>}
                    </ul>
                  </>
                )}
              </section>

              <section aria-label="Login link" className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Personal login link</h3>
                </div>
                {studentLink ? (
                  <>
                    <div className="rounded-xl border border-border bg-surface p-3 font-mono text-xs break-all text-muted-foreground leading-relaxed">{studentLink}</div>
                    <Button className="w-full gap-2" onClick={handleCopy}>
                      {copied ? <><Check className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy link</>}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full gap-2" onClick={loadLink} disabled={isLoadingLink}>
                    {isLoadingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Show login link
                  </Button>
                )}
              </section>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
