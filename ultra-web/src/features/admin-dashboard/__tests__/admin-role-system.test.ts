import { describe, it, expect, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Use service role client to bypass RLS for schema tests
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Unique suffix to avoid collisions between test runs
const uid = Date.now()

// Track auth user IDs for cleanup
const authUserIds: string[] = []
const createdIdsToDelete: { table: string; id: string }[] = []

async function createTestUser(emailPrefix: string) {
  const email = `${emailPrefix}-${uid}@ultra.test`
  // Delete if leftover from a previous run
  const { data: existing } = await supabase.auth.admin.listUsers()
  const old = existing?.users?.find((u) => u.email === email)
  if (old) await supabase.auth.admin.deleteUser(old.id)

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'test-password-123',
    email_confirm: true,
  })
  if (error) throw new Error(`Failed to create test user: ${error.message}`)
  authUserIds.push(data.user!.id)
  return data.user!.id
}

afterAll(async () => {
  // Clean up rows
  for (const { table, id } of createdIdsToDelete.reverse()) {
    await supabase.from(table).delete().eq('id', id)
  }
  // Clean up auth users
  for (const id of authUserIds) {
    await supabase.auth.admin.deleteUser(id)
  }
})

describe('Admin role system — Issue #16', () => {
  it('admin user can be assigned admin role via user_roles table', async () => {
    const adminUserId = await createTestUser('admin-test')

    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: adminUserId,
        role: 'admin',
        created_by: adminUserId,
      })
      .select()

    if (data && data.length > 0) {
      createdIdsToDelete.push({ table: 'user_roles', id: data[0].id })
    }

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data?.[0]?.role).toBe('admin')
    expect(data?.[0]?.user_id).toBe(adminUserId)
  })

  it('admin role assignment respects CHECK constraint for valid roles only', async () => {
    const userId = await createTestUser('role-check-test')

    // Try to insert invalid role
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'superadmin', // Invalid role
        created_by: userId,
      })

    expect(error).not.toBeNull()
    expect(error?.message?.toLowerCase()).toMatch(/check|violates/)
  })

  it('user_id has UNIQUE constraint — only one role per user', async () => {
    const userId = await createTestUser('unique-constraint-test')

    // Insert first role
    const { data: firstInsert, error: firstError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
        created_by: userId,
      })
      .select()

    if (firstInsert && firstInsert.length > 0) {
      createdIdsToDelete.push({ table: 'user_roles', id: firstInsert[0].id })
    }

    expect(firstError).toBeNull()

    // Try to insert second role for same user (should fail due to UNIQUE constraint)
    const { error: secondError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'rider',
        created_by: userId,
      })

    expect(secondError).not.toBeNull()
    expect(secondError?.message?.toLowerCase()).toMatch(/unique|duplicate/)
  })
})
