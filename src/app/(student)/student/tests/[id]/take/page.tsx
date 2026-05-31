'use client'

import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { startSubmission, saveAnswer, submitTest, recordViolation, verifySession } from '@/app/actions/submissions'
import { TestTimer } from '@/components/student/test-timer'
import { QuestionNavigator, type QuestionState } from '@/components/student/question-navigator'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, SkipForward, Send, Menu, X, Save, AlertTriangle, Maximize2 } from 'lucide-react'
import type { Question, Test } from '@/types/database'

export default function TakeTestPage() {
  const params = useParams()
  const testId = params.id as string
  const router = useRouter()

  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { text?: string; option?: string; skipped?: boolean }>>({})
  const [savedState, setSavedState] = useState<Record<string, boolean>>({})
  const [endsAt, setEndsAt] = useState<Date | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [showNav, setShowNav] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const saveTimersRef = useRef<Record<string, NodeJS.Timeout>>({})
  const [isPending, startTransition] = useTransition()

  // Anti-cheat
  const MAX_VIOLATIONS = 3
  const [violations, setViolations] = useState(0)
  const [showViolationWarning, setShowViolationWarning] = useState(false)
  const lastViolationRef = useRef(0)
  const violationsRef = useRef(0)
  const autoSubmittedRef = useRef(false)
  // Always points to the latest flushAllSaves so the violation handler isn't stale
  const flushAllSavesRef = useRef<() => Promise<void>>(async () => {})
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessionHijacked, setSessionHijacked] = useState(false)
  const sessionTokenRef = useRef<string | null>(null)

  // Initialize: load test, questions, start/resume submission
  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const [{ data: t }, { data: q }] = await Promise.all([
        supabase.from('tests').select('*').eq('id', testId).single(),
        supabase.from('questions').select('*').eq('test_id', testId).order('order_index'),
      ])
      if (!t || !q) { router.push('/student/dashboard'); return }

      setTest(t)
      setQuestions(q)

      const result = await startSubmission(testId)
      if (result?.error) { router.push('/student/dashboard'); return }

      const subId = result.submissionId!
      sessionTokenRef.current = result.sessionToken ?? null
      setSubmissionId(subId)

      // Calculate timer end time
      const { data: sub } = await supabase
        .from('submissions')
        .select('started_at')
        .eq('id', subId)
        .single()

      if (sub) {
        const end = new Date(new Date(sub.started_at).getTime() + t.duration_minutes * 60 * 1000)
        setEndsAt(end)
      }

      // Load existing answers
      const { data: existingAnswers } = await supabase
        .from('answers')
        .select('*')
        .eq('submission_id', subId)

      const answerMap: Record<string, { text?: string; option?: string; skipped?: boolean }> = {}
      existingAnswers?.forEach(a => {
        answerMap[a.question_id] = {
          text: a.answer_text ?? undefined,
          option: a.selected_option_id ?? undefined,
          skipped: a.is_skipped,
        }
      })
      setAnswers(answerMap)
      setLoading(false)
    }
    init()
  }, [testId])

  // Per-question debounced autosave — each question has its own timer
  // so navigating between questions doesn't cancel pending saves for other questions
  const triggerSave = useCallback((questionId: string) => {
    if (saveTimersRef.current[questionId]) clearTimeout(saveTimersRef.current[questionId])
    saveTimersRef.current[questionId] = setTimeout(async () => {
      if (!submissionId) return
      const ans = answers[questionId]
      await saveAnswer(submissionId, questionId, {
        answer_text: ans?.text,
        selected_option_id: ans?.option,
        is_skipped: ans?.skipped ?? false,
      })
      setSavedState(s => ({ ...s, [questionId]: true }))
    }, 800)
  }, [answers, submissionId])

  // Flush all pending saves immediately (called before final submit)
  const flushAllSaves = useCallback(async () => {
    if (!submissionId) return
    Object.keys(saveTimersRef.current).forEach(id => clearTimeout(saveTimersRef.current[id]))
    saveTimersRef.current = {}
    await Promise.all(
      Object.entries(answers).map(([questionId, ans]) =>
        saveAnswer(submissionId, questionId, {
          answer_text: ans?.text,
          selected_option_id: ans?.option,
          is_skipped: ans?.skipped ?? false,
        })
      )
    )
  }, [answers, submissionId])

  // Keep flushAllSavesRef current so violation handler always flushes latest answers
  useEffect(() => { flushAllSavesRef.current = flushAllSaves }, [flushAllSaves])

  // Auto-submit once violations hit the limit
  useEffect(() => {
    if (violations < MAX_VIOLATIONS || autoSubmittedRef.current || !submissionId) return
    autoSubmittedRef.current = true
    setIsSubmitting(true)
    flushAllSavesRef.current().then(() => submitTest(submissionId, testId))
  }, [violations, submissionId, testId])

  // Show warning dialog whenever a new violation is recorded (below the limit)
  useEffect(() => {
    if (violations > 0 && violations < MAX_VIOLATIONS) setShowViolationWarning(true)
  }, [violations])

  // Detect tab switch, window focus loss, and fullscreen exit — all share one debounce
  useEffect(() => {
    if (loading || !submissionId) return

    const trigger = () => {
      const now = Date.now()
      if (now - lastViolationRef.current < 2000) return
      lastViolationRef.current = now
      violationsRef.current += 1
      setViolations(violationsRef.current)
      recordViolation(submissionId)
    }

    // Re-enter fullscreen if the student refreshed the page mid-test
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    }

    const onVisibilityChange = () => { if (document.hidden) trigger() }
    const onFullscreenChange = () => { if (!document.fullscreenElement) trigger() }
    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('blur', trigger)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('blur', trigger)
    }
  }, [loading, submissionId])

  // Track fullscreen state to show the re-enter button in the header
  useEffect(() => {
    const update = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', update)
    update()
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])

  // Session heartbeat: detect if another device/tab has taken over this submission
  useEffect(() => {
    if (!submissionId || !sessionTokenRef.current) return
    const interval = setInterval(async () => {
      const valid = await verifySession(submissionId, sessionTokenRef.current!)
      if (!valid) setSessionHijacked(true)
    }, 30000)
    return () => clearInterval(interval)
  }, [submissionId])

  // Block right-click and keyboard shortcuts that open new tabs / devtools
  useEffect(() => {
    const blockMenu = (e: MouseEvent) => e.preventDefault()
    const blockKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey && ['t', 'n', 'w'].includes(e.key.toLowerCase())) e.preventDefault()
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))) e.preventDefault()
    }
    document.addEventListener('contextmenu', blockMenu)
    document.addEventListener('keydown', blockKeys)
    return () => {
      document.removeEventListener('contextmenu', blockMenu)
      document.removeEventListener('keydown', blockKeys)
    }
  }, [])

  const updateAnswer = (questionId: string, value: Partial<{ text?: string; option?: string; skipped?: boolean }>) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionId]: { ...prev[questionId], ...value } }
      return updated
    })
    setSavedState(s => ({ ...s, [questionId]: false }))
    triggerSave(questionId)
  }

  const handleSkip = () => {
    const q = questions[currentIndex]
    updateAnswer(q.id, { skipped: true, text: undefined, option: undefined })
    if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1)
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  const handleSubmit = async () => {
    if (!submissionId) return
    setIsSubmitting(true)
    await flushAllSaves()
    await submitTest(submissionId, testId)
  }

  const handleTimeUp = useCallback(async () => {
    if (!isSubmitting && submissionId) {
      setIsSubmitting(true)
      await flushAllSaves()
      submitTest(submissionId, testId)
    }
  }, [isSubmitting, submissionId, testId, flushAllSaves])

  const getQuestionState = (questionId: string, index: number): QuestionState => {
    if (index === currentIndex) return 'current'
    const ans = answers[questionId]
    if (ans?.skipped) return 'skipped'
    if (ans?.option || ans?.text) return 'answered'
    return 'unanswered'
  }

  const states: QuestionState[] = questions.map((q, i) => getQuestionState(q.id, i))

  // Count from raw answers — not from states — so the current question
  // is counted correctly even when it's highlighted as 'current' in the navigator
  const answeredCount = questions.filter(q => {
    const ans = answers[q.id]
    return !ans?.skipped && (ans?.option || ans?.text)
  }).length
  const skippedCount = questions.filter(q => answers[q.id]?.skipped).length
  const remainingCount = questions.length - answeredCount - skippedCount

  if (loading || !test || !endsAt) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading test...</div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const currentAnswer = answers[currentQuestion?.id] ?? {}

  return (
    <div className="min-h-svh flex flex-col bg-muted/20">
      {/* Test Header */}
      <div className="sticky top-14 z-40 bg-background border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm font-semibold truncate hidden sm:block">{test.title}</h1>
            <Badge variant="outline" className="text-xs shrink-0">
              {currentIndex + 1} / {questions.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {!isFullscreen && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs text-amber-600 border-amber-400 hidden sm:flex gap-1"
                onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
              >
                <Maximize2 className="h-3 w-3" />
                Fullscreen
              </Button>
            )}
            {violations > 0 && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-400 shrink-0 gap-1">
                <AlertTriangle className="h-3 w-3" />
                {violations}/{MAX_VIOLATIONS}
              </Badge>
            )}
            <TestTimer endsAt={endsAt} onTimeUp={handleTimeUp} />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setShowNav(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Progress bar */}
        <Progress
          value={(answeredCount / questions.length) * 100}
          className="h-1 rounded-none"
        />
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full gap-0">
        {/* Main content */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 min-h-0">
          {/* Question Card */}
          <Card className="flex-1 mb-4">
            <CardContent className="p-6 space-y-6">
              {/* Question header */}
              <div className="flex items-start gap-3">
                <span className="shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {currentIndex + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-base leading-relaxed">{currentQuestion.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {currentQuestion.type === 'mcq' ? 'MCQ' : currentQuestion.type === 'short_answer' ? 'Short Answer' : 'Essay'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}
                    </span>
                    {savedState[currentQuestion.id] && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Save className="h-3 w-3" /> Saved
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Answer Input */}
              {currentQuestion.type === 'mcq' && currentQuestion.options && (
                <RadioGroup
                  value={currentAnswer.option ?? ''}
                  onValueChange={val => updateAnswer(currentQuestion.id, { option: val, skipped: false })}
                  className="space-y-2"
                >
                  {currentQuestion.options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} />
                      <Label htmlFor={`opt-${opt.id}`} className="flex-1 cursor-pointer font-normal">
                        <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                        {opt.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === 'short_answer' && (
                <Textarea
                  value={currentAnswer.text ?? ''}
                  onChange={e => updateAnswer(currentQuestion.id, { text: e.target.value, skipped: false })}
                  placeholder="Type your answer here..."
                  rows={4}
                  className="resize-none"
                />
              )}

              {currentQuestion.type === 'long_answer' && (
                <Textarea
                  value={currentAnswer.text ?? ''}
                  onChange={e => updateAnswer(currentQuestion.id, { text: e.target.value, skipped: false })}
                  placeholder="Write your answer here..."
                  rows={10}
                  className="resize-none"
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation Footer */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              size="sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-orange-600"
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>

              {currentIndex === questions.length - 1 ? (
                <Button size="sm" onClick={() => setShowReview(true)}>
                  <Send className="h-4 w-4 mr-1" />
                  Review & Submit
                </Button>
              ) : (
                <Button size="sm" onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar Navigator */}
        <div className="hidden md:flex flex-col w-56 shrink-0 border-l bg-background p-4 space-y-4 sticky top-[7rem] h-fit">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Progress</p>
            <p className="text-xs text-green-700">{answeredCount} answered</p>
            <p className="text-xs text-orange-700">{skippedCount} skipped</p>
            <p className="text-xs text-muted-foreground">{remainingCount} remaining</p>
          </div>
          <QuestionNavigator
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            states={states}
            onJump={setCurrentIndex}
          />
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setShowReview(true)}
          >
            Review & Submit
          </Button>
        </div>
      </div>

      {/* Mobile Navigator Drawer */}
      <Dialog open={showNav} onOpenChange={setShowNav}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Question Navigator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-lg font-bold text-green-700">{answeredCount}</p>
                <p className="text-green-600">Answered</p>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <p className="text-lg font-bold text-orange-700">{skippedCount}</p>
                <p className="text-orange-600">Skipped</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-lg font-bold">{remainingCount}</p>
                <p className="text-muted-foreground">Remaining</p>
              </div>
            </div>
            <QuestionNavigator
              totalQuestions={questions.length}
              currentIndex={currentIndex}
              states={states}
              onJump={i => { setCurrentIndex(i); setShowNav(false) }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNav(false)} size="sm">
              Close
            </Button>
            <Button size="sm" onClick={() => { setShowNav(false); setShowReview(true) }}>
              Review & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Hijack Dialog — another device/tab took over */}
      <Dialog open={sessionHijacked} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Session Conflict
            </DialogTitle>
            <DialogDescription>
              This test was opened on another device or browser tab. Your answers up to this point have been saved.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center py-2">
            Only one active session is allowed per student. Please use a single device to complete your test.
          </p>
          <DialogFooter>
            <Button className="w-full" onClick={() => router.push('/student/dashboard')}>
              Return to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Violation Warning Dialog */}
      <Dialog open={showViolationWarning} onOpenChange={setShowViolationWarning}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Focus Lost Detected
            </DialogTitle>
            <DialogDescription>
              You exited fullscreen or switched away from the test. This has been recorded and your teacher will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-3 space-y-1">
            <p className="text-4xl font-bold text-amber-600">{violations}</p>
            <p className="text-sm text-muted-foreground">violation{violations !== 1 ? 's' : ''} recorded</p>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Your test will be <span className="font-semibold text-red-500">automatically submitted</span> after{' '}
              {MAX_VIOLATIONS} violations. You have{' '}
              <span className="font-semibold text-red-500">{MAX_VIOLATIONS - violations}</span> remaining.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowViolationWarning(false)} className="w-full">
              Return to Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review & Submit Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Your Answers</DialogTitle>
            <DialogDescription>
              Check your progress before submitting. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{answeredCount}</p>
                <p className="text-xs text-green-600">Answered</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-700">{skippedCount}</p>
                <p className="text-xs text-orange-600">Skipped</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{remainingCount}</p>
                <p className="text-xs text-muted-foreground">Not attempted</p>
              </div>
            </div>

            {(skippedCount > 0 || remainingCount > 0) && (
              <p className="text-sm text-muted-foreground text-center">
                You have {skippedCount + remainingCount} unanswered question{skippedCount + remainingCount !== 1 ? 's' : ''}.
                Are you sure you want to submit?
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReview(false)}>
              Continue Test
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className=""
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
