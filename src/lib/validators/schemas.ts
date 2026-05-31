import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const createStudentSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
})

export const updateStudentSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
})

export const testSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(1000).optional(),
  duration_minutes: z.coerce.number().min(1).max(480),
  instructions: z.string().max(2000).optional(),
  pass_mark: z.coerce.number().min(1, 'Pass mark must be at least 1').optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
})

export const mcqOptionSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1, 'Option text is required'),
})

export const questionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('mcq'),
    content: z.string().min(3, 'Question content is required'),
    marks: z.coerce.number().min(1),
    options: z.array(mcqOptionSchema).min(2).max(6),
    correct_option_id: z.string().min(1, 'Select the correct answer'),
  }),
  z.object({
    type: z.literal('short_answer'),
    content: z.string().min(3, 'Question content is required'),
    marks: z.coerce.number().min(1),
    options: z.null().optional(),
    correct_option_id: z.null().optional(),
  }),
  z.object({
    type: z.literal('long_answer'),
    content: z.string().min(3, 'Question content is required'),
    marks: z.coerce.number().min(1),
    options: z.null().optional(),
    correct_option_id: z.null().optional(),
  }),
])

export const joinTestSchema = z.object({
  invite_code: z.string().min(1, 'Please enter an invite code').max(20),
})

export const evaluationSchema = z.object({
  marks_obtained: z.coerce.number().min(0),
  teacher_comment: z.string().max(500).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type TestInput = z.infer<typeof testSchema>
export type QuestionInput = z.infer<typeof questionSchema>
export type JoinTestInput = z.infer<typeof joinTestSchema>
export type EvaluationInput = z.infer<typeof evaluationSchema>
