import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This creates a Supabase client for use in Server Components,
// Server Actions, and Route Handlers. It reads auth cookies from
// the incoming request rather than localStorage (which doesn't
// exist on the server).
//
// The cookies() call from next/headers gives read-only access
// to the request cookies, which is where Supabase stores the
// user's session token when using SSR mode.
export async function createServerSupabaseClient() {
const cookieStore = await cookies()

return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
    cookies: {
        getAll() {
        // Returns all cookies as an array of {name, value} objects.
        // Supabase needs to read its session cookie to know who is logged in.
        return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
        // This is called when Supabase needs to refresh the auth session
        // and write updated tokens back. In server components this is
        // a no-op (can't set cookies from a Server Component), but it's
        // required by the interface.
        try {
            cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
            )
        } catch {}
            },
        },
    }
)
}
