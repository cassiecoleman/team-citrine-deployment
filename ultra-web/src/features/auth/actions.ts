'use server'

import { createServiceRoleClient, createServerAuthClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
})

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export type AuthResponse<T = Record<string, unknown>> =
  | { success: true; data?: T }
  | { success: false; error: string }

/**
 * Sign up a new rider or driver
 * Creates auth user and corresponding user_roles/riders entry
 */
export async function signUp(input: SignUpInput): Promise<AuthResponse> {
  try {
    // Validate input
    const parsed = signUpSchema.safeParse(input)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Validation failed'
      return { success: false, error: message }
    }

    const { email, password } = parsed.data
    const supabase = createServiceRoleClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email verification
    })

    if (authError || !authData?.user) {
      return { success: false, error: `Sign up failed: ${authError?.message || 'Unknown error'}` }
    }

    const userId = authData.user.id

    // Create user_roles entry (default to rider)
    const { error: rolesError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'rider',
      })

    if (rolesError) {
      // Clean up auth user if roles insert failed
      await supabase.auth.admin.deleteUser(userId)
      return { success: false, error: `Role setup failed: ${rolesError.message}` }
    }

    return {
      success: true,
      data: { userId, email },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Sign up error: ${message}` }
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(input: SignInInput): Promise<AuthResponse> {
  try {
    // Validate input
    const parsed = signInSchema.safeParse(input)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Validation failed'
      return { success: false, error: message }
    }

    const { email, password } = parsed.data
    const supabase = await createServerAuthClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data?.session) {
      return { success: false, error: error?.message || 'Sign in failed' }
    }

    return {
      success: true,
      data: { session: data.session },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Sign in error: ${message}` }
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const supabase = await createServerAuthClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Sign out error: ${message}` }
  }
}

/**
 * Request a password reset email
 */
export async function resetPassword(input: ResetPasswordInput): Promise<AuthResponse> {
  try {
    const parsed = resetPasswordSchema.safeParse(input)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Validation failed'
      return { success: false, error: message }
    }

    const { email } = parsed.data
    const supabase = await createServerAuthClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: { message: 'Password reset email sent' },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Password reset error: ${message}` }
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<AuthResponse> {
  try {
    const supabase = await createServerAuthClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: { session: data?.session },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Get session error: ${message}` }
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const supabase = await createServerAuthClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
      return { success: false, error: error?.message || 'No user found' }
    }

    return {
      success: true,
      data: { user: data.user },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Get user error: ${message}` }
  }
}
