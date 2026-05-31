'use client'

import { useState, useTransition, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QuestionForm } from '@/components/teacher/question-form'
import { deleteQuestion } from '@/app/actions/questions'
import { updateTestStatus } from '@/app/actions/tests'
import { Pencil, Trash2, Plus, Share2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import type { Question, Test } from '@/types/database'

export default function QuestionsPage() {
  const params = useParams()
  const testId = params.id as string
  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  // Drawer state: `mounted` controls whether the DOM exists,
  // `open` drives the CSS transform (separated so transitions animate)
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isCopied, setIsCopied] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)

  const refresh = async () => {
    const supabase = createClient()
    const [{ data: t }, { data: q }] = await Promise.all([
      supabase.from('tests').select('*').eq('id', testId).single(),
      supabase.from('questions').select('*').eq('test_id', testId).order('order_index'),
    ])
    setTest(t)
    setQuestions(q ?? [])
  }

  useEffect(() => { refresh() }, [testId])

  // Mount first, then trigger enter animation on the next frame
  useEffect(() => {
    if (mounted) {
      const id = requestAnimationFrame(() => setOpen(true))
      return () => cancelAnimationFrame(id)
    }
  }, [mounted])

  function openDrawer(question: Question | null = null) {
    setEditingQuestion(question)
    setMounted(true)
  }

  function closeDrawer() {
    setOpen(false)
    setTimeout(() => {
      setMounted(false)
      setEditingQuestion(null)
    }, 300) // match transition duration
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteQuestion(deleteTarget.id, testId)
      if (result?.error) setError(result.error)
      else { setDeleteTarget(null); refresh() }
    })
  }

  const handlePublish = () => {
    startTransition(async () => {
      const newStatus = test?.status === 'published' ? 'draft' : 'published'
      const result = await updateTestStatus(testId, newStatus)
      if (result?.error) toast.error(result.error)
      else refresh()
    })
  }

  const copyInviteCode = () => {
    if (!test) return
    navigator.clipboard.writeText(test.invite_code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

  const typeLabel: Record<string, string> = {
    mcq: 'MCQ',
    short_answer: 'Short',
    long_answer: 'Essay',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{test?.title ?? 'Questions'}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · {totalMarks} total marks
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {test?.status === 'published' && (
            <Button variant="outline" size="sm" onClick={copyInviteCode}>
              <Share2 className="h-4 w-4 mr-2" />
              {isCopied ? 'Copied!' : `Code: ${test.invite_code}`}
            </Button>
          )}
          <Button
            variant={test?.status === 'published' ? 'outline' : 'default'}
            size="sm"
            onClick={handlePublish}
            disabled={isPending || questions.length === 0}
          >
            {test?.status === 'published' ? 'Unpublish' : 'Publish Test'}
          </Button>
          <Button size="sm" onClick={() => openDrawer(null)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {questions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-4">No questions yet. Add your first question to get started.</p>
            <Button onClick={() => openDrawer(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Question
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {questions.map((q, index) => (
          <Card key={q.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{q.content}</p>
                  {q.type === 'mcq' && q.options && (
                    <ul className="mt-2 space-y-1">
                      {(q.options as { id: string; text: string }[]).map((opt, i) => (
                        <li
                          key={opt.id}
                          className={`text-xs px-2 py-1 rounded ${
                            opt.id === q.correct_option_id
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {opt.text}
                          {opt.id === q.correct_option_id && ' ✓'}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">{typeLabel[q.type]}</Badge>
                    <span className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openDrawer(q)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(q)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        title="Delete question?"
        description={deleteTarget ? `"${deleteTarget.content.slice(0, 80)}${deleteTarget.content.length > 80 ? '…' : ''}" will be permanently removed.` : ''}
        confirmLabel="Delete Question"
        onConfirm={handleDelete}
        isPending={isPending}
      />

      {/* ── Question Drawer ── */}
      {mounted && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              'fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300',
              open ? 'opacity-100' : 'opacity-0',
            )}
            onClick={closeDrawer}
          />

          {/* Panel */}
          <div
            className={cn(
              'fixed top-0 right-0 h-full w-full max-w-[520px] bg-white z-[61]',
              'flex flex-col border-l border-border shadow-2xl',
              'transition-transform duration-300 ease-in-out',
              open ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold">
                  {editingQuestion ? 'Edit Question' : 'Add Question'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingQuestion ? 'Update the question details below' : 'Fill in the details to add a question'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6">
              <QuestionForm
                key={editingQuestion?.id ?? 'new'}
                testId={testId}
                question={editingQuestion ?? undefined}
                onSuccess={() => { closeDrawer(); refresh() }}
                onCancel={closeDrawer}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
