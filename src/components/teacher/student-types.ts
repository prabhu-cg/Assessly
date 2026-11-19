export type StudentTestEntry = {
  testId: string
  submissionId: string | null
  title: string
  state: 'not_started' | 'in_progress' | 'to_grade' | 'marked'
  obtained: number | null
  total: number | null
  submittedAt: string | null
}

export type StudentRow = {
  id: string
  full_name: string
  created_at: string
  year_level: string | null
  tests: StudentTestEntry[]
  assignments: StudentAssignmentEntry[]
}

export type StudentAssignmentEntry = {
  assignmentId: string
  submissionId: string | null
  title: string
  status: 'not_started' | 'in_progress' | 'submitted' | 'returned' | 'evaluated'
  released: boolean
  isLate: boolean
  obtained: number | null
  total: number | null
  submittedAt: string | null
  dueAt: string | null
}
