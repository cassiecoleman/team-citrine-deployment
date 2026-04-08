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
const createdIds: { table: string; id: string }[] = []

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
  // Clean up DB rows in reverse order (respects FK constraints)
  for (const { table, id } of createdIds.reverse()) {
    await supabase.from(table).delete().eq('id', id)
  }
  // Clean up auth users
  for (const id of authUserIds) {
    await supabase.auth.admin.deleteUser(id)
  }
})

describe('Riders schema — Issue #11', () => {
  it('user_roles table exists and accepts inserts', async () => {
    const userId = await createTestUser('role-test')

    const { data, error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'rider' })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.role).toBe('rider')
    expect(data!.version).toBe(1)
    createdIds.push({ table: 'user_roles', id: data!.id })

  })

  it('riders table exists and accepts inserts with audit columns', async () => {
    const userId = await createTestUser('rider-profile')

    const { data, error } = await supabase
      .from('riders')
      .insert({ user_id: userId, name: 'Test Rider' })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.name).toBe('Test Rider')
    expect(data!.created_at).toBeTruthy()
    expect(data!.updated_at).toBeTruthy()
    expect(data!.version).toBe(1)
    expect(data!.deleted_at).toBeNull()
    createdIds.push({ table: 'riders', id: data!.id })
  })

  it('rider_profiles table supports child profiles linked to a rider', async () => {
    const userId = await createTestUser('child-profile')

    // Create rider first
    const { data: rider } = await supabase
      .from('riders')
      .insert({ user_id: userId, name: 'Parent Rider' })
      .select()
      .single()

    createdIds.push({ table: 'riders', id: rider!.id })

    // Create child profile
    const { data: profile, error } = await supabase
      .from('rider_profiles')
      .insert({
        rider_id: rider!.id,
        name: 'Child Profile',
        is_child: true,
        notes: 'Needs car seat',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(profile).toBeTruthy()
    expect(profile!.is_child).toBe(true)
    expect(profile!.rider_id).toBe(rider!.id)
    createdIds.push({ table: 'rider_profiles', id: profile!.id })
  })

  it('emergency_contacts table links to rider_profiles', async () => {
    const userId = await createTestUser('emergency')

    const { data: rider } = await supabase
      .from('riders')
      .insert({ user_id: userId, name: 'Emergency Test Rider' })
      .select()
      .single()
    createdIds.push({ table: 'riders', id: rider!.id })

    const { data: profile } = await supabase
      .from('rider_profiles')
      .insert({ rider_id: rider!.id, name: 'Child', is_child: true })
      .select()
      .single()
    createdIds.push({ table: 'rider_profiles', id: profile!.id })

    const { data: contact, error } = await supabase
      .from('emergency_contacts')
      .insert({
        rider_profile_id: profile!.id,
        name: 'Rosa Martinez',
        phone: '+1-555-0100',
        relationship: 'grandmother',
        is_primary: true,
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(contact).toBeTruthy()
    expect(contact!.name).toBe('Rosa Martinez')
    expect(contact!.is_primary).toBe(true)
    createdIds.push({ table: 'emergency_contacts', id: contact!.id })
  })

  it('notification_preferences table accepts user preferences', async () => {
    const userId = await createTestUser('notif')

    const { data, error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        sms_enabled: true,
        push_enabled: false,
        email_enabled: true,
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.sms_enabled).toBe(true)
    expect(data!.push_enabled).toBe(false)
    createdIds.push({ table: 'notification_preferences', id: data!.id })
  })
})
