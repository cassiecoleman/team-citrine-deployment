'use server'

import { createServiceRoleClient, createServerAuthClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Role-based authorization
async function requireAdminRole() {
  // Get the current user's session from server cookies
  const supabase = await createServerAuthClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData?.user) {
    throw new Error('Unauthorized: No active session')
  }

  const userId = authData.user.id

  // Check if user has active admin role (not deleted)
  const supabaseService = createServiceRoleClient()
  const { data: roleData, error: roleError } = await supabaseService
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .is('deleted_at', null) // Only consider non-deleted roles
    .single()

  if (roleError || roleData?.role !== 'admin') {
    throw new Error('Unauthorized: Admin role required')
  }

  return userId
}

// Validation schemas
const createAdminUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const roleValues = ['rider', 'driver', 'admin'] as const

const updateAdminRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(roleValues, {
    message: "Role must be 'rider', 'driver', or 'admin'",
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
    // Verify admin role and get admin user ID
    const adminUserId = await requireAdminRole()

    // Validate input
    const parsed = createAdminUserSchema.safeParse(input)
    if (!parsed.success) {
      const errors = parsed.error.issues
      const message = errors[0]?.message || 'Validation failed'
      return { success: false, error: message }
    }

    const { email, password } = parsed.data
    const supabase = createServiceRoleClient()

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
        created_by: adminUserId,
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
    // Verify admin role and get admin user ID
    const adminUserId = await requireAdminRole()

    // Validate input
    const parsed = updateAdminRoleSchema.safeParse(input)
    if (!parsed.success) {
      const errors = parsed.error.issues
      const message = errors[0]?.message || 'Validation failed'
      return { success: false, error: message }
    }

    const { userId, role } = parsed.data
    const supabase = createServiceRoleClient()

    // Update role
    const { data, error } = await supabase
      .from('user_roles')
      .update({
        role,
        updated_by: adminUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .is('deleted_at', null) // Only update non-deleted roles
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
      .is('deleted_at', null) // Only return non-deleted admins
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
 * Get current user's role (public)
 */
export async function getCurrentUserRole(): Promise<ActionResponse> {
  try {
    // Get current user from server session
    const supabase = await createServerAuthClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData?.user) {
      return { success: false, error: 'Unauthorized: No active session' }
    }

    const supabaseService = createServiceRoleClient()
    const { data, error } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .is('deleted_at', null) // Only return active roles
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
