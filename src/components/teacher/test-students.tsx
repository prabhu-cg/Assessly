'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { assignStudentsToTest, removeStudentFromTest } from '@/app/actions/tests'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Loader2, X, ClipboardList, CheckCircle2, Clock, CircleMinus, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Submission = {
  id: string
  status: 'in_progress' | 'submitted' | 'evaluated'
  obtained_marks: number | null
  total_marks: number | null
}

export type EnrolledStudent = {
  id: string
  full_name: string
  submission: Submission | null
}

export type AvailableStudent = {
  id: string
  full_name: string
}

interface TestStudentsProps {
  testId: string
  testStatus: string
  enrolled: EnrolledStudent[]
  available: AvailableStudent[]
  totalMarks: number
}

function useDrawer() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (mounted) {
      const id = requestAnimationFrame(() => setOpen(true))
      return () => cancelAnimationFrame(id)
    }
  }, [mounted])

  const openDrawer = () => setMounted(true)
  const closeDrawer = () => {
    setOpen(false)
    setTimeout(() => setMounted(false), 300)
  }

  return { mounted, open, openDrawer, closeDrawer }
}

function statusConfig(submission: Submission | null) {
  if (!submission) return { label: 'Not started', variant: 'muted' as const, Icon: CircleMinus }
  if (submission.status === 'in_progress') return { label: 'In progress', variant: 'outline' as const, Icon: Clock }
  if (submission.status === 'submitted') return { label: 'Submitted', variant: 'default' as const, Icon: ClipboardList }
  return { label: 'Evaluated', variant: 'success' as const, Icon: CheckCircle2 }
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const drawerClass = (open: boolean) => cn(
  'fixed top-0 right-0 h-full w-full max-w-[440px] bg-background z-[61]',
  'flex flex-col border-l border-border shadow-2xl',
  'transition-transform duration-300 ease-in-out',
  open ? 'translate-x-0' : 'translate-x-full',
)
const backdropClass = (open: boolean) => cn(
  'fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300',
  open ? 'opacity-100' : 'opacity-0',
)

export function TestStudents({ testId, testStatus, enrolled, available, totalMarks }: TestStudentsProps) {
  const isPublished = testStatus === 'published'
  const drawer = useDrawer()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isAssigning, startAssign] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [, startRemove] = useTransition()

  const toggleStudent = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(prev =>
      prev.size === available.length
        ? new Set()
        : new Set(available.map(s => s.id))
    )
  }

  const handleAssign = () => {
    if (selected.size === 0) return
    startAssign(async () => {
      const result = await assignStudentsToTest(testId, Array.from(selected))
      if (result?.error) toast.error(result.error)
      else {
        toast.success(`${selected.size} student${selected.size > 1 ? 's' : ''} assigned to test`)
        setSelected(new Set())
        drawer.closeDrawer()
      }
    })
  }

  const handleRemove = (studentId: string, name: string) => {
    setRemovingId(studentId)
    startRemove(async () => {
      const result = await removeStudentFromTest(testId, studentId)
      if (result?.error) { toast.error(result.error); setRemovingId(null) }
      else toast.success(`${name} removed from test`)
    })
  }

  const openAssignDrawer = () => {
    setSelected(new Set())
    drawer.openDrawer()
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Students{enrolled.length > 0 ? ` (${enrolled.length})` : ''}
            </CardTitle>
            {available.length > 0 && (
              <span title={!isPublished ? 'Publish the test first to assign students' : undefined}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={isPublished ? openAssignDrawer : undefined}
                  disabled={!isPublished}
                  className="gap-1.5 h-7 text-xs"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Assign Students
                </Button>
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-1">
          {enrolled.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {available.length > 0
                ? 'No students assigned yet. Use Assign Students to add them directly.'
                : 'No students enrolled yet. Students can join using the invite code.'}
            </p>
          ) : (
            enrolled.map(student => {
              const { label, variant, Icon } = statusConfig(student.submission)
              const isEvaluated = student.submission?.status === 'evaluated'
              const isSubmitted = student.submission?.status === 'submitted'
              const isRemoving = removingId === student.id

              return (
                <div key={student.id} className="flex items-center gap-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-muted-foreground">{initials(student.full_name)}</span>
                  </div>

                  <p className="flex-1 min-w-0 text-sm font-medium truncate">{student.full_name}</p>

                  <div className="flex items-center gap-2 shrink-0">
                    {isEvaluated && (
                      <span className="text-sm font-semibold tabular-nums">
                        {student.submission!.obtained_marks ?? 0}/{totalMarks}
                      </span>
                    )}

                    <Badge variant={variant} className="gap-1">
                      <Icon className="h-3 w-3" />
                      {label}
                    </Badge>

                    {isSubmitted && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        render={<Link href={`/teacher/tests/${testId}/submissions/${student.submission!.id}`} />}
                      >
                        Evaluate
                      </Button>
                    )}
                    {isEvaluated && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        render={<Link href={`/teacher/tests/${testId}/submissions/${student.submission!.id}`} />}
                      >
                        View
                      </Button>
                    )}

                    <button
                      onClick={() => handleRemove(student.id, student.full_name)}
                      disabled={isRemoving}
                      title="Remove from test"
                      className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {isRemoving
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <X className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* ── Assign Students Drawer ── */}
      {drawer.mounted && (
        <>
          <div className={backdropClass(drawer.open)} onClick={drawer.closeDrawer} />
          <div className={drawerClass(drawer.open)}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold">Assign Students</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {available.length} student{available.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <button
                type="button"
                onClick={drawer.closeDrawer}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Select all row */}
              <button
                type="button"
                onClick={toggleAll}
                className="w-full flex items-center gap-3 px-6 py-3 border-b border-border hover:bg-muted/40 transition-colors text-sm text-muted-foreground"
              >
                <div className={cn(
                  'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                  selected.size === available.length && available.length > 0
                    ? 'bg-primary border-primary'
                    : 'border-border'
                )}>
                  {selected.size === available.length && available.length > 0 && (
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  )}
                </div>
                <span>Select all</span>
                {selected.size > 0 && (
                  <span className="ml-auto font-medium text-foreground">{selected.size} selected</span>
                )}
              </button>

              {available.map(student => {
                const checked = selected.has(student.id)
                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => toggleStudent(student.id)}
                    className="w-full flex items-center gap-3 px-6 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className={cn(
                      'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                      checked ? 'bg-primary border-primary' : 'border-border'
                    )}>
                      {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-muted-foreground">{initials(student.full_name)}</span>
                    </div>
                    <span className="text-sm font-medium text-left">{student.full_name}</span>
                  </button>
                )
              })}
            </div>

            <div className="px-6 py-4 border-t border-border shrink-0">
              <Button
                className="w-full"
                disabled={selected.size === 0 || isAssigning}
                onClick={handleAssign}
              >
                {isAssigning
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Assigning…</>
                  : selected.size > 0
                    ? `Assign ${selected.size} Student${selected.size > 1 ? 's' : ''}`
                    : 'Select students to assign'}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
