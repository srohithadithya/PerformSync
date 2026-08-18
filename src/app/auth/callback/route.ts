import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as any
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error("Auth Callback Error (Code):", error.message)
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
    }
  } else if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (error) {
      console.error("Auth Callback Error (Token):", error.message)
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
    }
  } else {
    // If there is no code or token, it might be an invalid link
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Invalid or expired magic link. Please try again.")}`, request.url))
  }

  // URL to redirect to after sign in process completes
  // After auth callback, redirect to a role assignment route or straight to dashboard
  return NextResponse.redirect(new URL('/auth/role-check', request.url))
}
