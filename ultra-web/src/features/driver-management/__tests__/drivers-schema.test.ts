import { describe, it, expect, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const uid = Date.now()
const authUserIds: string[] = []
const createdIds: { table: string; id: string }[] = []

async function createTestUser(prefix: string) {
  const email = `${prefix}-${uid}@ultra.test`
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
  for (const { table, id } of createdIds.reverse()) {
    await supabase.from(table).delete().eq('id', id)
  }
  for (const id of authUserIds) {
    await supabase.auth.admin.deleteUser(id)
  }
})

describe('Drivers schema — Issue #12', () => {
  it('drivers table exists and accepts inserts with vehicle info', async () => {
    const userId = await createTestUser('driver-test')

    const { data, error } = await supabase
      .from('drivers')
      .insert({
        user_id: userId,
        name: 'Test Driver',
        phone: '+1-555-0200',
        vehicle_make: 'Toyota',
        vehicle_model: 'Camry',
        vehicle_year: 2022,
        vehicle_color: 'Blue',
        license_plate: `TEST-${uid}`,
        is_child_safe: true,
        status: 'available',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.name).toBe('Test Driver')
    expect(data!.vehicle_make).toBe('Toyota')
    expect(data!.is_child_safe).toBe(true)
    expect(data!.status).toBe('available')
    expect(Number(data!.rating)).toBe(5.00)
    expect(data!.total_ratings).toBe(0)
    expect(data!.version).toBe(1)
    createdIds.push({ table: 'drivers', id: data!.id })
  })

  it('drivers table enforces status check constraint', async () => {
    const userId = await createTestUser('driver-status')

    const { error } = await supabase
      .from('drivers')
      .insert({
        user_id: userId,
        name: 'Bad Status Driver',
        status: 'invalid_status',
      })

    expect(error).toBeTruthy()
    expect(error!.code).toBeTruthy()
  })

  it('driver_safety_certs table links to drivers', async () => {
    const userId = await createTestUser('driver-cert')

    const { data: driver } = await supabase
      .from('drivers')
      .insert({ user_id: userId, name: 'Cert Driver', status: 'offline' })
      .select()
      .single()
    createdIds.push({ table: 'drivers', id: driver!.id })

    const { data: cert, error } = await supabase
      .from('driver_safety_certs')
      .insert({
        driver_id: driver!.id,
        cert_type: 'child_seat',
        cert_number: 'CS-12345',
        issuing_authority: 'TN DMV',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(cert).toBeTruthy()
    expect(cert!.cert_type).toBe('child_seat')
    expect(cert!.driver_id).toBe(driver!.id)
    createdIds.push({ table: 'driver_safety_certs', id: cert!.id })
  })

  it('driver_locations table accepts GPS position upserts', async () => {
    const userId = await createTestUser('driver-loc')

    const { data: driver } = await supabase
      .from('drivers')
      .insert({ user_id: userId, name: 'Location Driver', status: 'available' })
      .select()
      .single()
    createdIds.push({ table: 'drivers', id: driver!.id })

    const { data: loc, error } = await supabase
      .from('driver_locations')
      .insert({
        driver_id: driver!.id,
        lat: 35.1495,
        lng: -90.0490,
        heading: 180.0,
        speed_mph: 25.5,
        source: 'gps',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(loc).toBeTruthy()
    expect(loc!.lat).toBe(35.1495)
    expect(loc!.lng).toBe(-90.049)
    expect(loc!.source).toBe('gps')
    createdIds.push({ table: 'driver_locations', id: loc!.id })
  })
})
