// This is a Next.js Route Handler (server-side endpoint).
  // Google OAuth redirects here after the user approves access.
  // Supabase sends a "code" parameter that we exchange for a session.

  import { createServerClient } from '@supabase/ssr'
  import { cookies } from 'next/headers'
  import { NextRequest, NextResponse } from 'next/server'

  export async function GET(request: NextRequest) {
    // Extract the "code" query parameter from the redirect URL.
    // e.g. /auth/callback?code=abc123&next=/dashboard
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            },
          },
        }
      )

      // Exchange the one-time code for a persistent session.
      // This writes the auth tokens to cookies, logging the user in.
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }

    // If something went wrong, redirect to login with an error flag.
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }