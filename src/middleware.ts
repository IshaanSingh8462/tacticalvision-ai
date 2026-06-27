 import { createServerClient } from '@supabase/ssr'
  import { NextResponse, type NextRequest } from 'next/server'

  export async function middleware(request: NextRequest) {
    // We create a response object first so we can potentially
    // modify headers/cookies before returning it.
    let supabaseResponse = NextResponse.next({
      request,
    })

    // Create a Supabase server client using the request/response cycle.
    // This is different from the server.ts utility — middleware runs
    // in the Edge Runtime and needs direct access to request/response
    // to read and refresh auth cookies.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // When Supabase refreshes an expired auth token, it needs to
            // write the new token back to the cookie. We update both the
            // request and response to keep them in sync.
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

    // IMPORTANT: Do not write any code between createServerClient and
    // supabase.auth.getUser(). A subtle bug exists where the session
    // can be stale if you do other work first.
    const { data: { user } } = await supabase.auth.getUser()

    // If the user is not logged in and is trying to access a protected route,
    // redirect them to the login page.
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Always return the supabaseResponse — it may contain updated auth cookies.
    return supabaseResponse
  }

  // This tells Next.js which routes the middleware should run on.
  // We skip static files and images for performance.
  export const config = {
    matcher: [
      '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
  }
