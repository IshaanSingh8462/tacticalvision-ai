import { createBrowserClient } from '@supabase/ssr'

// This function creates a Supabase client configured for use in
// browser (client-side) components. It reads your URL and anon key
// from environment variables.
//
// We export a function rather than a singleton instance because
// in Next.js App Router, components can re-render and we want
// a fresh client each time to avoid stale session state.
export function createClient() {
return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
