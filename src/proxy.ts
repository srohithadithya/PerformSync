import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // High-level Security Constraints:
  // If user is not logged in and trying to access protected routes, redirect to login.
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/evaluation') ||
      request.nextUrl.pathname.startsWith('/review'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // NOTE: For full HR/Manager role checks, you would fetch the user's role from the public.users table here
  // and redirect non-managers away from /dashboard.
  // Example:
  // if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
  //   const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  //   if (profile?.role === 'employee') {
  //      url.pathname = '/evaluation'
  //      return NextResponse.redirect(url)
  //   }
  // }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
