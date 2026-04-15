/**
 * Authorization utilities for server actions
 * Provides role-based access control checks for protected operations
 */

import { createServerAuthClient } from '@/lib/supabase-server'

/**
 * Thrown when authorization fails
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export type AuthRole = 'rider' | 'driver' | 'admin'

/**
 * Get current user and their role
 * @returns User ID and role, or null if not authenticated
 */
export async function getCurrentUserAndRole(): Promise<{
  userId: string
  role: AuthRole
} | null> {
  try {
    const supabase = await createServerAuthClient()

    // Get current session user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    // Fetch user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (roleError || !roleData) {
      return null
    }

    return {
      userId: user.id,
      role: roleData.role as AuthRole,
    }
  } catch (error) {
    return null
  }
}

/**
 * Require authentication and a specific role
 * Throws UnauthorizedError if user is not authenticated or doesn't have required role
 *
 * @example
 * export async function deleteUser(userId: string) {
 *   const userAndRole = await requireRole('admin')
 *   // Now we know user is admin, safe to proceed
 * }
 */
export async function requireRole(
  ...requiredRoles: AuthRole[]
): Promise<{ userId: string; role: AuthRole }> {
  const userAndRole = await getCurrentUserAndRole()

  if (!userAndRole) {
    throw new UnauthorizedError('Not authenticated')
  }

  if (!requiredRoles.includes(userAndRole.role)) {
    throw new UnauthorizedError(
      `Requires one of: ${requiredRoles.join(
        ', '
      )}. You have: ${userAndRole.role}`
    )
  }

  return userAndRole
}

/**
 * Require authentication only (no specific role required)
 * @returns User ID and role
 */
export async function requireAuth(): Promise<{
  userId: string
  role: AuthRole
}> {
  const userAndRole = await getCurrentUserAndRole()

  if (!userAndRole) {
    throw new UnauthorizedError('Not authenticated')
  }

  return userAndRole
}

/**
 * Get current user role (returns null if not authenticated)
 */
export async function getCurrentRole(): Promise<AuthRole | null> {
  const userAndRole = await getCurrentUserAndRole()
  return userAndRole?.role ?? null
}

/**
 * Check if user has a specific role (returns false if not authenticated)
 */
export async function hasRole(...roles: AuthRole[]): Promise<boolean> {
  const userRole = await getCurrentRole()
  return userRole !== null && roles.includes(userRole)
}

/**
 * Get current user ID (returns null if not authenticated)
 */
export async function getCurrentUserId(): Promise<string | null> {
  const userAndRole = await getCurrentUserAndRole()
  return userAndRole?.userId ?? null
}
