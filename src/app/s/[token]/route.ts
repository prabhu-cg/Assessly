import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const origin = new URL(request.url).origin

  const admin = createAdminClient()

  // Find student by access_token
  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, role, access_token')
    .eq('access_token', token)
    .eq('role', 'student')
    .single()

  if (!profile) {
    return NextResponse.redirect(new URL('/login?notice=invalid-link', origin))
  }

  const supabase = await createClient()

  // Try signing in — access_token doubles as their Supabase Auth password
  let { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: token,
  })

  // First-time use for students created before this feature: sync their password
  if (error) {
    await admin.auth.admin.updateUserById(profile.id, { password: token })
    const retry = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: token,
    })
    error = retry.error
  }

  if (error) {
    return NextResponse.redirect(new URL('/login?notice=link-error', origin))
  }

  return NextResponse.redirect(new URL('/student/dashboard', origin))
}
