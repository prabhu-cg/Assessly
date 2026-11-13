'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MacbookFrame } from '@/components/shared/macbook-frame'

const SCREENS = [
  { key: 'dashboard', label: 'Dashboard', src: '/mockups/dashboard-light-v2.png', srcDark: '/mockups/dashboard-dark-v2.png', alt: 'Assessly dashboard: submissions waiting for grading and published tests with students taking them now' },
  { key: 'tests', label: 'Tests', src: '/mockups/tests-light-v2.png', srcDark: '/mockups/tests-dark-v2.png', alt: 'Assessly tests page: test cards with status, search, filters and a newest-first switch' },
  { key: 'students', label: 'Students', src: '/mockups/students-light-v2.png', srcDark: '/mockups/students-dark-v2.png', alt: 'Assessly students page: student cards showing year, tests assigned and completed' },
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
