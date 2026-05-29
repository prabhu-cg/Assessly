export type UserRole = 'teacher' | 'student'
export type TestStatus = 'draft' | 'published' | 'archived'
export type QuestionType = 'mcq' | 'short_answer' | 'long_answer'
export type SubmissionStatus = 'in_progress' | 'submitted' | 'evaluated'

export interface MCQOption {
  id: string
  text: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_by: string | null
  created_at: string
}

export interface Test {
  id: string
  title: string
  description: string | null
  teacher_id: string
  duration_minutes: number
  status: TestStatus
  invite_code: string
  instructions: string | null
  pass_mark: number | null
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  test_id: string
  type: QuestionType
  content: string
  options: MCQOption[] | null
  correct_option_id: string | null
  marks: number
  order_index: number
  created_at: string
}

export interface Submission {
  id: string
  test_id: string
  student_id: string
  status: SubmissionStatus
  started_at: string
  submitted_at: string | null
  total_marks: number | null
  obtained_marks: number | null
  created_at: string
}

export interface Answer {
  id: string
  submission_id: string
  question_id: string
  answer_text: string | null
  selected_option_id: string | null
  marks_obtained: number | null
  teacher_comment: string | null
  last_saved_at: string
  is_skipped: boolean
}

// Joined types for UI
export interface TestWithQuestionCount extends Test {
  question_count: number
  teacher: Pick<Profile, 'full_name' | 'email'>
}

export interface SubmissionWithStudent extends Submission {
  student: Pick<Profile, 'full_name' | 'email'>
  test: Pick<Test, 'title' | 'duration_minutes'>
}

export interface AnswerWithQuestion extends Answer {
  question: Question
}
