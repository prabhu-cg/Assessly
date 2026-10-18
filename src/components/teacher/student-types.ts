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
}
