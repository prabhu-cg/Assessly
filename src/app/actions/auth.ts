'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStudentSchema, loginSchema, updateStudentSchema } from '@/lib/validators/schemas'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'Invalid email or password' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Authentication failed' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  revalidatePath('/', 'layout')

  if (profile?.role === 'teacher') {
    redirect('/teacher/dashboard')
  } else {
    redirect('/student/dashboard')
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function createStudent(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: teacherProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (teacherProfile?.role !== 'teacher') {
    return { error: 'Only teachers can create student accounts' }
  }

  const parsed = createStudentSchema.safeParse({
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const fullName = `${parsed.data.first_name.trim()} ${parsed.data.last_name.trim()}`
  const accessToken = crypto.randomUUID()

  // Auto-generate an internal email — students never see or use it
  const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
  const shortId = accessToken.replace(/-/g, '').slice(0, 8)
  const email = `${sanitize(parsed.data.first_name)}.${sanitize(parsed.data.last_name)}.${shortId}@assessly.internal`

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: accessToken,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'student',
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    await admin
      .from('profiles')
      .update({ created_by: user.id, access_token: accessToken })
      .eq('id', data.user.id)
  }

  revalidatePath('/teacher/students')
  return { success: true, accessToken }
}

export async function getStudentAccessLink(studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { data: student } = await admin
    .from('profiles')
    .select('id, email, access_token')
    .eq('id', studentId)
    .eq('created_by', user.id)
    .eq('role', 'student')
    .single()

  if (!student) return { error: 'Student not found' }

  const accessToken = student.access_token ?? crypto.randomUUID()

  // Sync Auth password = access_token so /s/[token] always works
  await admin.auth.admin.updateUserById(studentId, { password: accessToken })

  if (!student.access_token) {
    await admin.from('profiles').update({ access_token: accessToken }).eq('id', studentId)
  }

  return { success: true, accessToken }
}

export async function updateStudent(studentId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = updateStudentSchema.safeParse({
    full_name: formData.get('full_name'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  const { data: student } = await admin
    .from('profiles')
    .select('id')
    .eq('id', studentId)
    .eq('created_by', user.id)
    .eq('role', 'student')
    .single()

  if (!student) return { error: 'Student not found' }

  const { error } = await admin
    .from('profiles')
    .update({ full_name: parsed.data.full_name })
    .eq('id', studentId)

  if (error) return { error: error.message }

  revalidatePath('/teacher/students')
  return { success: true }
}

export async function deleteStudent(studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { data: student } = await admin
    .from('profiles')
    .select('id')
    .eq('id', studentId)
    .eq('created_by', user.id)
    .eq('role', 'student')
    .single()

  if (!student) return { error: 'Student not found' }

  const { error } = await admin.auth.admin.deleteUser(studentId)
  if (error) return { error: error.message }

  revalidatePath('/teacher/students')
  return { success: true }
}
