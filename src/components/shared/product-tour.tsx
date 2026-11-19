'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MacbookFrame } from '@/components/shared/macbook-frame'

const SCREENS = [
  { key: 'dashboard', label: 'Dashboard', src: '/mockups/dashboard-light-v3.png', srcDark: '/mockups/dashboard-dark-v3.png', alt: 'Assessly dashboard: tests and assignments waiting for grading, published tests with students taking them now, and assignments out' },
  { key: 'tests', label: 'Tests', src: '/mockups/tests-light-v3.png', srcDark: '/mockups/tests-dark-v3.png', alt: 'Assessly tests page: test cards with status, search, filters and a newest-first switch' },
  { key: 'assignments', label: 'Assignments', src: '/mockups/assignments-light-v3.png', srcDark: '/mockups/assignments-dark-v3.png', alt: 'Assessly assignments page: assignment cards with due date, questions, students assigned, work handed in and a count waiting for review' },
  { key: 'students', label: 'Students', src: '/mockups/students-light-v3.png', srcDark: '/mockups/students-dark-v3.png', alt: 'Assessly students page: student cards showing year, tests assigned and completed' },
] as const

export function ProductTour() {
  const [active, setActive] = useState<(typeof SCREENS)[number]['key']>('dashboard')
  const screen = SCREENS.find(s => s.key === active)!

  return (
    <div>
      <div role="tablist" aria-label="Product screens" className="mx-auto mb-8 flex w-fit rounded-full border border-border bg-surface p-1">
        {SCREENS.map(s => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={active === s.key}
            onClick={() => setActive(s.key)}
            className={cn(
              'h-10 rounded-full px-5 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
              active === s.key ? 'bg-primary-soft text-primary-text' : 'text-muted-foreground hover:text-ink-strong',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div key={screen.key} className="fade-in">
        <MacbookFrame src={screen.src} srcDark={screen.srcDark} alt={screen.alt} />
      </div>
    </div>
  )
}
