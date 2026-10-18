'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, ClipboardList, Search, SearchX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EntityCard, EntityGrid, EntityMeta } from '@/components/shared/entity-card'
import { StudentActions } from '@/components/teacher/student-actions'
import type { StudentRow } from '@/components/teacher/student-types'
import { formatRelativeTime } from '@/lib/utils'

function StudentCard({ student, index }: { student: StudentRow; index: number }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const assigned = student.tests.length
  const completed = student.tests.filter(t => t.state === 'to_grade' || t.state === 'marked').length
  const toGrade = student.tests.filter(t => t.state === 'to_grade').length

  return (
    <EntityCard
      index={index}
      title={student.full_name}
      onTitleClick={() => setDetailsOpen(true)}
      subtitle={student.year_level}
      leading={
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-sm font-bold text-muted-foreground">
          {student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </span>
      }
      meta={
        <>
          <EntityMeta icon={ClipboardList} className="tabular-nums">{assigned} assigned</EntityMeta>
          <EntityMeta icon={CheckCircle2} className="tabular-nums">{completed} completed</EntityMeta>
          {toGrade > 0 && <span className="font-semibold tabular-nums text-primary-text">{toGrade} to grade</span>}
        </>
      }
      footer={
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" aria-hidden />
          Added {formatRelativeTime(student.created_at)}
        </span>
      }
      menu={
        <StudentActions
          studentId={student.id}
          studentName={student.full_name}
          addedDate={student.created_at}
          yearLevel={student.year_level}
          tests={student.tests}
          detailsOpen={detailsOpen}
          onDetailsOpenChange={setDetailsOpen}
        />
      }
    />
  )
}

export function StudentsBrowser({ students }: { students: StudentRow[] }) {
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students
      .filter(s => !q || s.full_name.toLowerCase().includes(q) || (s.year_level ?? '').toLowerCase().includes(q))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, undefined, { sensitivity: 'base' }))
  }, [students, query])

  return (
    <div className="space-y-5">
      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search name or year"
          aria-label="Search students by name or year"
          className="pl-8"
        />
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <SearchX className="mx-auto mb-3 h-6 w-6 text-primary" />
          <p className="text-sm font-semibold">No students match &ldquo;{query.trim()}&rdquo;</p>
          <button type="button" onClick={() => setQuery('')} className="mt-2 text-sm font-semibold text-primary-text hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <EntityGrid>
          {visible.map((student, i) => (
            <StudentCard key={student.id} student={student} index={i} />
          ))}
        </EntityGrid>
      )}
    </div>
  )
}
