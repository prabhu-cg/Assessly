'use client'

import { useState, useTransition, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { QuestionForm } from '@/components/teacher/question-form'
import { deleteQuestion, reorderQuestions } from '@/app/actions/questions'
import { updateTestStatus } from '@/app/actions/tests'
import { Pencil, Trash2, Plus, Share2, X, Eye, GripVertical, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import type { Question, Test } from '@/types/database'

const statusVariant: Record<string, 'success' | 'secondary' | 'outline' | 'muted'> = {
  draft: 'muted', published: 'success', archived: 'outline',
}

const typeLabel: Record<string, string> = {
  mcq: 'MCQ', short_answer: 'Short Answer', long_answer: 'Essay',
}

// ── Sortable question card ─────────────────────────────────────────────────

interface SortableQuestionProps {
  question: Question
  index: number
  onEdit: (q: Question) => void
  onDelete: (q: Question) => void
}

function SortableQuestion({ question: q, index, onEdit, onDelete }: SortableQuestionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: q.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={cn('transition-shadow', isDragging && 'shadow-lg opacity-60 ring-2 ring-primary/30')}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="shrink-0 mt-0.5 p-1 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing rounded touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>

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
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(q)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(q)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Preview modal ──────────────────────────────────────────────────────────

function PreviewModal({ open, onClose, test, questions }: {
  open: boolean
  onClose: () => void
  test: Test | null
  questions: Question[]
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview — {test?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {test?.instructions && (
            <div className="rounded-lg bg-muted/50 border p-3 text-sm text-muted-foreground">
              {test.instructions}
            </div>
          )}

          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm leading-relaxed">{q.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{typeLabel[q.type]}</Badge>
                    <span className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {q.type === 'mcq' && q.options && (
                <div className="space-y-1.5 ml-11">
                  {(q.options as { id: string; text: string }[]).map((opt, j) => (
                    <div key={opt.id} className="text-sm px-3 py-2 rounded-lg border border-border text-muted-foreground">
                      <span className="font-medium mr-2">{String.fromCharCode(65 + j)}.</span>
                      {opt.text}
                    </div>
                  ))}
                </div>
              )}

              {(q.type === 'short_answer' || q.type === 'long_answer') && (
                <div className="ml-11 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground italic">
                  {q.type === 'short_answer' ? 'Short answer text field' : 'Long answer / essay text area'}
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function QuestionsPage() {
  const params = useParams()
  const testId = params.id as string
  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isCopied, setIsCopied] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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
    setTimeout(() => { setMounted(false); setEditingQuestion(null) }, 300)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setQuestions(items => {
      const oldIndex = items.findIndex(q => q.id === active.id)
      const newIndex = items.findIndex(q => q.id === over.id)
      const newOrder = arrayMove(items, oldIndex, newIndex)
      reorderQuestions(testId, newOrder.map(q => q.id))
      return newOrder
    })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Link href="/teacher/tests" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to tests
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{test?.title ?? 'Questions'}</h1>
            {test?.status && (
              <Badge variant={statusVariant[test.status]}>{test.status}</Badge>
            )}
          </div>
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
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            disabled={questions.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
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
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Empty state */}
      {questions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-4">No questions yet. Add your first question to get started.</p>
            <Button onClick={() => openDrawer(null)}>
              <Plus className="h-4 w-4 mr-2" />Add First Question
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Drag-and-drop question list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {questions.map((q, index) => (
              <SortableQuestion
                key={q.id}
                question={q}
                index={index}
                onEdit={openDrawer}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Preview modal */}
      <PreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        test={test}
        questions={questions}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        title="Delete question?"
        description={deleteTarget
          ? `"${deleteTarget.content.slice(0, 80)}${deleteTarget.content.length > 80 ? '…' : ''}" will be permanently removed.`
          : ''}
        confirmLabel="Delete Question"
        onConfirm={handleDelete}
        isPending={isPending}
      />

      {/* Add / Edit drawer */}
      {mounted && (
        <>
          <div
            className={cn(
              'fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300',
              open ? 'opacity-100' : 'opacity-0',
            )}
            onClick={closeDrawer}
          />
          <div
            className={cn(
              'fixed top-0 right-0 h-full w-full max-w-[520px] bg-white z-[61]',
              'flex flex-col border-l border-border shadow-2xl',
              'transition-transform duration-300 ease-in-out',
              open ? 'translate-x-0' : 'translate-x-full',
            )}
          >
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
