'use client'

import { cn } from '@/lib/utils'

export type QuestionState = 'unanswered' | 'answered' | 'skipped' | 'current'

interface QuestionNavigatorProps {
  totalQuestions: number
  currentIndex: number
  states: QuestionState[]
  onJump: (index: number) => void
}

export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  states,
  onJump,
}: QuestionNavigatorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: totalQuestions }).map((_, i) => {
          const state = i === currentIndex ? 'current' : (states[i] ?? 'unanswered')
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              className={cn(
                'h-8 w-8 rounded text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                state === 'current' && 'bg-primary text-primary-foreground',
                state === 'answered' && 'bg-green-100 text-green-800 hover:bg-green-200',
                state === 'skipped' && 'bg-orange-100 text-orange-800 hover:bg-orange-200',
                state === 'unanswered' && 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
              aria-label={`Go to question ${i + 1} (${state})`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-green-100 border border-green-300" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-orange-100 border border-orange-300" />
          <span>Skipped</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-muted border" />
          <span>Not visited</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-primary" />
          <span>Current</span>
        </div>
      </div>
    </div>
  )
}
