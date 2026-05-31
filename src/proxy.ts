import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Public paths that don't require auth
  const publicPaths = ['/login', '/student-login', '/']
  const isStudentLink = pathname.startsWith('/s/')
  if (isStudentLink) return supabaseResponse

  if (publicPaths.includes(pathname)) {
    if (user) {
      // Redirect logged-in users away from login
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const redirect = profile?.role === 'teacher' ? '/dashboard' : '/dashboard'
      return NextResponse.redirect(new URL(redirect, request.url))
    }
    return supabaseResponse
  }

  // Require auth for all other routes
  if (!user) {
    const dest = pathname.startsWith('/student') ? '/student-login' : '/login'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Role-based route protection
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  if (pathname.startsWith('/teacher') && role !== 'teacher') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (pathname.startsWith('/student') && role !== 'student') {
    return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
