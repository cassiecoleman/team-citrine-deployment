'use server'

import { createServiceRoleClient } from '@/lib/supabase-server'
import { createClient } from '@/lib/supabase'
import { z } from 'zod'

// Role-based authorization
async function requireAdminRole() {
  const supabase = createClient()
  const { data: user } = await supabase.auth.getUser()

  if (!user?.user) {
    throw new Error('Unauthorized: No active session')
  }

  // Check if user has admin role
  const { data: roleData, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.user.id)
    .single()

  if (error || roleData?.role !== 'admin') {
    throw new Error('Unauthorized: Admin role required')
  }
}

// Validation schemas
const createAdminUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const updateAdminRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['rider', 'driver', 'admin'], {
    errorMap: () => ({ message: "Role must be 'rider', 'driver', or 'admin'" }),
  }),
})

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>
export type UpdateAdminRoleInput = z.infer<typeof updateAdminRoleSchema>

export type ActionResponse = {
  success: boolean
  error?: string
  data?: any
}

/**
 * Create a new admin user (admin-only)
 * Creates auth user with admin role in user_roles table
 */
export async function createAdminUser(input: CreateAdminUserInput): Promise<ActionResponse> {
  try {
    // Verify admin role
    await requireAdminRole()

    // Validate input
    const parsed = createAdminUserSchema.safeParse(input)
    if (!parsed.success) {
      const errors = parsed.error.errors
      const message = errors[0]?.message || 'Validation failed'
      return { success: false, error: message }
    }

    const { email, password } = parsed.data
    const supabase = createServiceRoleClient()
    const { data: authData } = await supabase.auth.getUser()

    // Create auth user
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !newUser?.user) {
      return { success: false, error: `Failed to create user: ${authError?.message}` }
    }

    // Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'admin',
        created_by: authData?.user?.id,
      })

    if (roleError) {
      // Clean up auth user if role assignment failed
      await supabase.auth.admin.deleteUser(newUser.user.id)
      return { success: false, error: `Failed to assign admin role: ${roleError.message}` }
    }

    return {
      success: true,
      data: { userId: newUser.user.id, email },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Update a user's role (admin-only)
 */
export async function updateUserRole(input: UpdateAdminRoleInput): Promise<ActionResponse> {
  try {
    // Verify admin role
    await requireAdminRole()

    // Validate input
    const parsed = updateAdminRoleSchema.safeParse(input)
    if (!parsed.success) {
      const errors = parsed.error.errors
      const message = errors[0]?.message || 'Validation failed'
      return { success: false, error: message }
    }

    const { userId, role } = parsed.data
    const supabase = createServiceRoleClient()
    const { data: authData } = await supabase.auth.getUser()

    // Update role
    const { data, error } = await supabase
      .from('user_roles')
      .update({
        role,
        updated_by: authData?.user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'User role not found' }
    }

    return {
      success: true,
      data: { userId, role: data[0].role },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Get all admin users (admin-only)
 */
export async function getAdminUsers(): Promise<ActionResponse> {
  try {
    // Verify admin role
    await requireAdminRole()

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('user_roles')
      .select('id, user_id, role, created_at, updated_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: { admins: data },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Delete admin user and revoke admin role (admin-only)
 */
export async function deleteAdminUser(adminUserId: string): Promise<ActionResponse> {
  try {
    // Verify admin role
    await requireAdminRole()

    if (!adminUserId || typeof adminUserId !== 'string') {
      return { success: false, error: 'Invalid user ID' }
    }

    const supabase = createServiceRoleClient()

    // Delete from user_roles (soft delete via soft delete fields)
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', adminUserId)

    if (roleError) {
      return { success: false, error: `Failed to revoke admin role: ${roleError.message}` }
    }

    return {
      success: true,
      data: { message: 'Admin user revoked' },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Get current user's role
 */
export async function getCurrentUserRole(): Promise<ActionResponse> {
  try {
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()

    if (!user?.user) {
      return { success: false, error: 'Unauthorized: No active session' }
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id)
      .single()

    if (error) {
      return { success: false, error: 'User role not found' }
    }

    return {
      success: true,
      data: { role: data.role },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
