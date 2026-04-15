'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '../actions'

type LoginFormState = {
  success: boolean
  error: string | null
}

export function validateLoginInput(email: string, password: string): string | null {
  if (!email || !email.includes('@')) {
    return 'Invalid email address'
  }

  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters'
  }

  return null
}

export function LoginForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(handleSignIn, {
    success: false,
    error: null,
  })

  async function handleSignIn(
    _prevState: LoginFormState,
    formData: FormData
  ): Promise<LoginFormState> {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const validationError = validateLoginInput(email, password)
    if (validationError) {
      return { success: false, error: validationError }
    }

    const result = await signIn({ email, password })

    if (result.success) {
      // Keep event-driven navigation in the submit handler (no effect-based redirect).
      router.push('/')
      return { success: true, error: null }
    }

    return { success: false, error: result.error || 'Sign in failed' }
  }

  return (
    <form action={formAction} className="w-full max-w-md space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          disabled={isPending}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          disabled={isPending}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="••••••••"
        />
      </div>

      {state.error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isPending ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="/register" className="text-blue-600 hover:underline">
          Register
        </a>
      </p>
    </form>
  )
}
