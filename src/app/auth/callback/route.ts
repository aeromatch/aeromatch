import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  
  // Get code from query params (OAuth and email confirmation flow)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const type = searchParams.get('type') // 'recovery' for password reset
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle errors from Supabase
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  // Handle code exchange (for email confirmation, recovery, OAuth)
  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Check if this is a recovery (password reset) flow
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password`)
    }

    // For OAuth/regular login - check if user has a profile with role
    if (data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, onboarding_completed')
        .eq('id', data.user.id)
        .single()

      // If no profile exists (new OAuth user), redirect to role selection
      if (!profile) {
        return NextResponse.redirect(`${origin}/onboarding/role`)
      }

      // If profile exists but no role or onboarding not completed
      if (!profile.role) {
        return NextResponse.redirect(`${origin}/onboarding/role`)
      }

      // If onboarding not completed, send to appropriate onboarding
      if (!profile.onboarding_completed) {
        if (profile.role === 'technician') {
          return NextResponse.redirect(`${origin}/onboarding/technician`)
        } else {
          return NextResponse.redirect(`${origin}/onboarding/company`)
        }
      }
    }

    // User has complete profile, go to dashboard
    return NextResponse.redirect(`${origin}${next}`)
  }

  // If no code but user is trying to access callback, redirect to auth
  return NextResponse.redirect(`${origin}/auth?error=No authentication code provided`)
}
