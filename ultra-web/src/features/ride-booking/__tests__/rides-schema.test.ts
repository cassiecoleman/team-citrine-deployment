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

async function createTestRider(prefix: string) {
  const userId = await createTestUser(prefix)
  const { data: rider } = await supabase
    .from('riders')
    .insert({ user_id: userId, name: `${prefix} rider` })
    .select()
    .single()
  createdIds.push({ table: 'riders', id: rider!.id })
  return { userId, riderId: rider!.id }
}

async function createTestDriver(prefix: string) {
  const userId = await createTestUser(prefix)
  const { data: driver } = await supabase
    .from('drivers')
    .insert({ user_id: userId, name: `${prefix} driver`, status: 'available' })
    .select()
    .single()
  createdIds.push({ table: 'drivers', id: driver!.id })
  return { userId, driverId: driver!.id }
}

afterAll(async () => {
  for (const { table, id } of createdIds.reverse()) {
    await supabase.from(table).delete().eq('id', id)
  }
  for (const id of authUserIds) {
    await supabase.auth.admin.deleteUser(id)
  }
})

describe('Rides schema — Issue #13', () => {
  it('rides table exists and accepts a ride request with all fields', async () => {
    const { riderId } = await createTestRider('ride-create')

    const { data, error } = await supabase
      .from('rides')
      .insert({
        rider_id: riderId,
        pickup_lat: 35.1495,
        pickup_lng: -90.0490,
        pickup_address: '123 Beale St, Memphis TN',
        dropoff_lat: 35.1175,
        dropoff_lng: -89.9711,
        dropoff_address: '456 Elvis Presley Blvd, Memphis TN',
        status: 'requested',
        fare_estimate: 18.50,
        is_child_safe_required: false,
        prefer_trusted_driver: false,
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.status).toBe('requested')
    expect(Number(data!.fare_estimate)).toBe(18.5)
    expect(data!.requested_at).toBeTruthy()
    expect(data!.driver_id).toBeNull()
    expect(data!.version).toBe(1)
    createdIds.push({ table: 'rides', id: data!.id })
  })

  it('rides table enforces valid status values', async () => {
    const { riderId } = await createTestRider('ride-status')

    const { error } = await supabase
      .from('rides')
      .insert({
        rider_id: riderId,
        pickup_lat: 35.0,
        pickup_lng: -90.0,
        pickup_address: 'A',
        dropoff_lat: 35.1,
        dropoff_lng: -90.1,
        dropoff_address: 'B',
        status: 'flying',
      })

    expect(error).toBeTruthy()
  })

  it('ride_stops table supports multi-stop rides', async () => {
    const { riderId } = await createTestRider('ride-stops')

    const { data: ride } = await supabase
      .from('rides')
      .insert({
        rider_id: riderId,
        pickup_lat: 35.0,
        pickup_lng: -90.0,
        pickup_address: 'Start',
        dropoff_lat: 35.2,
        dropoff_lng: -90.2,
        dropoff_address: 'End',
      })
      .select()
      .single()
    createdIds.push({ table: 'rides', id: ride!.id })

    const { data: stop, error } = await supabase
      .from('ride_stops')
      .insert({
        ride_id: ride!.id,
        stop_order: 0,
        lat: 35.1,
        lng: -90.1,
        address: 'Lincoln Elementary School',
        label: 'School',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(stop).toBeTruthy()
    expect(stop!.label).toBe('School')
    expect(stop!.stop_order).toBe(0)
    createdIds.push({ table: 'ride_stops', id: stop!.id })
  })

  it('ride_status_history records status transitions', async () => {
    const { riderId } = await createTestRider('ride-history')

    const { data: ride } = await supabase
      .from('rides')
      .insert({
        rider_id: riderId,
        pickup_lat: 35.0,
        pickup_lng: -90.0,
        pickup_address: 'A',
        dropoff_lat: 35.1,
        dropoff_lng: -90.1,
        dropoff_address: 'B',
        status: 'requested',
      })
      .select()
      .single()
    createdIds.push({ table: 'rides', id: ride!.id })

    const { data: entry, error } = await supabase
      .from('ride_status_history')
      .insert({
        ride_id: ride!.id,
        from_status: null,
        to_status: 'requested',
        change_source: 'rider',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(entry).toBeTruthy()
    expect(entry!.to_status).toBe('requested')
    expect(entry!.change_source).toBe('rider')
    expect(entry!.changed_at).toBeTruthy()
    createdIds.push({ table: 'ride_status_history', id: entry!.id })
  })

  it('ride_ratings table stores post-ride feedback and tips', async () => {
    const { riderId } = await createTestRider('ride-rating')
    const { driverId } = await createTestDriver('ride-rating-driver')

    const { data: ride } = await supabase
      .from('rides')
      .insert({
        rider_id: riderId,
        driver_id: driverId,
        pickup_lat: 35.0,
        pickup_lng: -90.0,
        pickup_address: 'A',
        dropoff_lat: 35.1,
        dropoff_lng: -90.1,
        dropoff_address: 'B',
        status: 'completed',
      })
      .select()
      .single()
    createdIds.push({ table: 'rides', id: ride!.id })

    const { data: rating, error } = await supabase
      .from('ride_ratings')
      .insert({
        ride_id: ride!.id,
        rider_id: riderId,
        driver_id: driverId,
        rider_gave_driver: 5,
        rider_comment: 'Great ride!',
        tip_amount: 3.00,
        rider_submitted: true,
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(rating).toBeTruthy()
    expect(rating!.rider_gave_driver).toBe(5)
    expect(Number(rating!.tip_amount)).toBe(3.0)
    expect(rating!.rider_submitted).toBe(true)
    createdIds.push({ table: 'ride_ratings', id: rating!.id })
  })
})
