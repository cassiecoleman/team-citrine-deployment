'use server'

import { createServerAuthClient, createServiceRoleClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['rider', 'driver', 'admin']).default('rider'),
})

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
})

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type SignUpInput = z.input<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export type AuthResponse<T = void> =
  | { success: true; data: T }
  | { success: true }
  | { success: false; error: string }

/**
 * Sign up a new rider or driver
 * Creates auth user and corresponding user_roles/riders entry
 */
export async function signUp(
  input: SignUpInput
): Promise<AuthResponse<{ userId: string; email: string; role: 'rider' | 'driver' | 'admin' }>> {
  try {
    // Validate input
    const parsed = signUpSchema.safeParse(input)
    if (!parsed.success) {
      const errors = parsed.error.errors
      const message = errors[0]?.message || 'Validation failed'
      return { success: false, error: message }
    }

    const { email, password, role } = parsed.data
    const supabase = createServiceRoleClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for dev/demo; switch to false when email service is configured
      user_metadata: { role },
    })

    if (authError || !authData?.user) {
      return { success: false, error: `Sign up failed: ${authError?.message || 'Unknown error'}` }
    }

    const userId = authData.user.id

    // Create user_roles entry
    const { error: rolesError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
      })

    if (rolesError) {
      // Clean up auth user if roles insert failed
      await supabase.auth.admin.deleteUser(userId)
      return { success: false, error: `Role setup failed: ${rolesError.message}` }
    }

    // Create riders row so downstream features (rides, passes, splits) can look up rider_id
    if (role === 'rider') {
      const nameFromEmail = email.split('@')[0]
      const { error: riderError } = await supabase
        .from('riders')
        .insert({
          user_id: userId,
          name: nameFromEmail,
        })

      if (riderError) {
        // Clean up: remove role and auth user
        await supabase.from('user_roles').delete().eq('user_id', userId)
        await supabase.auth.admin.deleteUser(userId)
        return { success: false, error: `Rider profile setup failed: ${riderError.message}` }
      }
    }

    return {
      success: true,
      data: { userId, email, role },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Sign up error: ${message}` }
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(input: SignInInput): Promise<AuthResponse<{ session: unknown }>> {
  try {
    // Validate input
    const parsed = signInSchema.safeParse(input)
    if (!parsed.success) {
      const errors = parsed.error.errors
      const message = errors[0]?.message || 'Validation failed'
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
export async function resetPassword(
  input: ResetPasswordInput
): Promise<AuthResponse<{ message: string }>> {
  try {
    const parsed = resetPasswordSchema.safeParse(input)
    if (!parsed.success) {
      const errors = parsed.error.errors
      const message = errors[0]?.message || 'Validation failed'
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
export async function getSession(): Promise<AuthResponse<{ user: unknown }>> {
  try {
    const supabase = await createServerAuthClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
      return { success: false, error: error?.message || 'No authenticated user' }
    }

    return {
      success: true,
      data: { user: data.user },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Get session error: ${message}` }
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthResponse<{ user: unknown }>> {
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

/**
 * Get the role for a given user ID (rider/driver/admin)
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single()

    if (error || !data) return null
    return data.role
  } catch {
    return null
  }
}
