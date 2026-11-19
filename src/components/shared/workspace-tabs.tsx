'use client'

import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type WorkspaceTab = { key: string; label: string; count?: number; content: ReactNode }

/** Pill segmented control over the assignment's three working areas. All panels stay mounted so a half-typed search survives a tab change. */
export function AssignmentWorkspace({ tabs, initial }: { tabs: WorkspaceTab[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0].key)
  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Assignment sections" className="flex w-full max-w-full overflow-x-auto rounded-full sm:w-fit border border-border bg-surface p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={active === t.key}
            aria-controls={`panel-${t.key}`}
            type="button"
            onClick={() => setActive(t.key)}
            className={cn(
              'flex h-10 flex-1 shrink-0 items-center justify-center gap-2 rounded-full px-3 text-sm sm:flex-none sm:px-4 font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
              active === t.key ? 'bg-primary-soft text-primary-text' : 'text-muted-foreground hover:text-ink-strong',
            )}
          >
            {t.label}
            {t.count !== undefined && <span className={cn('rounded-full px-1.5 text-xs tabular-nums', active === t.key ? 'bg-primary/20' : 'bg-secondary')}>{t.count}</span>}
          </button>
        ))}
      </div>
      {tabs.map(t => (
        <div key={t.key} role="tabpanel" id={`panel-${t.key}`} aria-labelledby={`tab-${t.key}`} hidden={active !== t.key}>
          {t.content}
        </div>
      ))}
    </div>
  )
}
