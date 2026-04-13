import { describe, it, expect, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const uid = Date.now()
let userSeq = 0
const authUserIds: string[] = []
const createdIds: { table: string; id: string }[] = []

async function createTestUser(prefix: string) {
  userSeq += 1
  const email = `${prefix}-${uid}-${userSeq}@ultra.test`

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
  const { data } = await supabase
    .from('riders')
    .insert({ user_id: userId, name: `${prefix} rider` })
    .select()
    .single()
  createdIds.push({ table: 'riders', id: data!.id })
  return { userId, riderId: data!.id }
}

async function createTestDriver(prefix: string) {
  const userId = await createTestUser(prefix)
  const { data } = await supabase
    .from('drivers')
    .insert({ user_id: userId, name: `${prefix} driver`, status: 'available' })
    .select()
    .single()
  createdIds.push({ table: 'drivers', id: data!.id })
  return { userId, driverId: data!.id }
}

async function createTestRide(riderId: string) {
  const { data } = await supabase
    .from('rides')
    .insert({
      rider_id: riderId,
      pickup_lat: 35.1495,
      pickup_lng: -90.049,
      pickup_address: '123 Beale St, Memphis TN',
      dropoff_lat: 35.1175,
      dropoff_lng: -89.9711,
      dropoff_address: '456 Elvis Presley Blvd, Memphis TN',
      status: 'in_progress',
    })
    .select()
    .single()
  createdIds.push({ table: 'rides', id: data!.id })
  return data!.id
}

afterAll(async () => {
  for (const { table, id } of createdIds.reverse()) {
    await supabase.from(table).delete().eq('id', id)
  }
  for (const id of authUserIds) {
    await supabase.auth.admin.deleteUser(id)
  }
})

describe('Safety schema — Issue #15', () => {
  it('trusted_drivers table links a rider to a trusted driver', async () => {
    const { riderId } = await createTestRider('trust-rider')
    const { driverId } = await createTestDriver('trust-driver')

    const { data, error } = await supabase
      .from('trusted_drivers')
      .insert({
        rider_id: riderId,
        driver_id: driverId,
        nickname: 'My regular driver',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.nickname).toBe('My regular driver')
    expect(data!.rider_id).toBe(riderId)
    expect(data!.driver_id).toBe(driverId)
    createdIds.push({ table: 'trusted_drivers', id: data!.id })
  })

  it('trusted_drivers enforces unique(rider_id, driver_id)', async () => {
    const { riderId } = await createTestRider('trust-dup-rider')
    const { driverId } = await createTestDriver('trust-dup-driver')

    const firstInsert = await supabase
      .from('trusted_drivers')
      .insert({ rider_id: riderId, driver_id: driverId })
      .select()
      .single()

    expect(firstInsert.error).toBeNull()
    expect(firstInsert.data).toBeTruthy()
    createdIds.push({ table: 'trusted_drivers', id: firstInsert.data!.id })

    const { error } = await supabase
      .from('trusted_drivers')
      .insert({ rider_id: riderId, driver_id: driverId })

    expect(error).toBeTruthy()
    expect(error!.code).toBe('23505') // unique_violation
  })

  it('trip_shares table accepts a share link with token and tracking', async () => {
    const { riderId } = await createTestRider('share-rider')
    const rideId = await createTestRide(riderId)

    const { data, error } = await supabase
      .from('trip_shares')
      .insert({
        ride_id: rideId,
        share_token: `share-${uid}`,
        recipient_name: 'Rosa Martinez',
        recipient_phone: '+1-555-0100',
        is_active: true,
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.share_token).toBe(`share-${uid}`)
    expect(data!.recipient_name).toBe('Rosa Martinez')
    expect(data!.is_active).toBe(true)
    expect(data!.view_count).toBe(0)
    createdIds.push({ table: 'trip_shares', id: data!.id })
  })

  it('trip_shares enforces unique share_token', async () => {
    const { riderId } = await createTestRider('share-dup')
    const rideId = await createTestRide(riderId)

    const token = `dup-token-${uid}`
    await supabase
      .from('trip_shares')
      .insert({
        ride_id: rideId,
        share_token: token,
        recipient_name: 'A',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })

    const { error } = await supabase
      .from('trip_shares')
      .insert({
        ride_id: rideId,
        share_token: token,
        recipient_name: 'B',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })

    expect(error).toBeTruthy()
    expect(error!.code).toBe('23505')
  })

  it('driver_flags table accepts a structured flag report', async () => {
    const { riderId } = await createTestRider('flag-rider')
    const { driverId } = await createTestDriver('flag-driver')
    const rideId = await createTestRide(riderId)

    const { data, error } = await supabase
      .from('driver_flags')
      .insert({
        driver_id: driverId,
        reporter_id: riderId,
        ride_id: rideId,
        reason: 'safety',
        details: 'Driver was speeding through a school zone',
        status: 'pending',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.reason).toBe('safety')
    expect(data!.status).toBe('pending')
    expect(data!.reviewed_by).toBeNull()
    expect(data!.reviewed_at).toBeNull()
    createdIds.push({ table: 'driver_flags', id: data!.id })
  })

  it('driver_flags enforces valid reason values', async () => {
    const { riderId } = await createTestRider('flag-reason')
    const { driverId } = await createTestDriver('flag-reason-d')

    const { error } = await supabase
      .from('driver_flags')
      .insert({
        driver_id: driverId,
        reporter_id: riderId,
        reason: 'invalid_reason',
        status: 'pending',
      })

    expect(error).toBeTruthy()
  })

  it('driver_flags enforces valid status values', async () => {
    const { riderId } = await createTestRider('flag-status')
    const { driverId } = await createTestDriver('flag-status-d')

    const { error } = await supabase
      .from('driver_flags')
      .insert({
        driver_id: driverId,
        reporter_id: riderId,
        reason: 'behavior',
        status: 'invalid_status',
      })

    expect(error).toBeTruthy()
  })
})
