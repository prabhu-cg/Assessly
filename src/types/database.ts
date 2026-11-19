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
  image_url?: string | null
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

// ── Assignments ────────────────────────────────────────────────────────────
export type AssignmentStatus = 'draft' | 'published' | 'archived'
export type AssignmentSubmissionStatus = 'in_progress' | 'submitted' | 'returned' | 'evaluated'

export interface Assignment {
  id: string
  teacher_id: string
  title: string
  description: string | null
  instructions: string | null
  status: AssignmentStatus
  due_at: string | null
  response_marks: number
  pass_mark: number | null
  created_at: string
  updated_at: string
}

export interface AssignmentQuestion {
  id: string
  assignment_id: string
  type: QuestionType
  content: string
  options: MCQOption[] | null
  correct_option_id: string | null
  image_url?: string | null
  marks: number
  order_index: number
  created_at: string
}

export interface AssignmentFile {
  id: string
  name: string
  size_bytes: number
  content_type: string | null
  /** Short-lived link to view the file, added on the server. */
  url?: string
  /** Same file, served as a download. */
  downloadUrl?: string
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  status: AssignmentSubmissionStatus
  response_text: string | null
  started_at: string
  submitted_at: string | null
  is_late: boolean
  revision_count: number
  total_marks: number | null
  response_marks_obtained: number | null
  obtained_marks: number | null
  overall_feedback: string | null
  returned_at: string | null
  evaluated_at: string | null
  released_at: string | null
}

export interface AssignmentAnswer {
  id: string
  submission_id: string
  question_id: string
  answer_text: string | null
  selected_option_id: string | null
  marks_obtained: number | null
  teacher_comment: string | null
}
