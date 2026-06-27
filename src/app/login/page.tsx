'use client'  
  // 'use client' marks this as a Client Component — it runs in the browser.
  // We need this because we're using useState, event handlers, and the
  // Supabase browser client (which reads from cookies in the browser).

  import { useState } from 'react'
  import { createClient } from '@/lib/supabase/client'
  import { useRouter } from 'next/navigation'

  export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSignUp, setIsSignUp] = useState(false)
    
    const supabase = createClient()
    const router = useRouter()

    async function handleEmailAuth() {
      setIsLoading(true)
      setError(null)

      // Supabase handles email + password auth in one SDK call.
      // signUp creates the account AND logs the user in automatically.
      // signInWithPassword logs an existing user in.
      const { error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      // router.push navigates to the dashboard.
      // router.refresh() tells Next.js to re-fetch server components
      // on the current page, which picks up the new auth session.
      router.push('/dashboard')
      router.refresh()
    }

    async function handleGoogleAuth() {
      // signInWithOAuth redirects the user to Google's consent screen.
      // After they approve, Google redirects back to your /auth/callback route.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) setError(error.message)
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-full max-w-md p-8 bg-gray-900 rounded-xl border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-2">TacticalVision AI</h1>
          <p className="text-gray-400 mb-8">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleEmailAuth}
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <button
            onClick={handleGoogleAuth}
            className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            Continue with Google
          </button>

          <p className="mt-6 text-center text-gray-400 text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-400 hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    )
  }
