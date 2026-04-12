import { describe, it, expect, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
  return { userId: data.user!.id, email }
}

async function createTestRider(prefix: string) {
  const { userId, email } = await createTestUser(prefix)
  const { data } = await supabase
    .from('riders')
    .insert({ user_id: userId, name: `${prefix} rider` })
    .select()
    .single()
  createdIds.push({ table: 'riders', id: data!.id })
  return { userId, riderId: data!.id, email }
}

async function createAuthenticatedRiderClient(email: string) {
  const riderClient = createClient(supabaseUrl, supabaseAnonKey)
  const { error } = await riderClient.auth.signInWithPassword({
    email,
    password: 'test-password-123',
  })
  if (error) throw new Error(`Failed to sign in test rider: ${error.message}`)
  return riderClient
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
      status: 'completed',
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

describe('Payments schema — Issue #14', () => {
  it('payments table accepts a payment record with lifecycle fields', async () => {
    const { riderId } = await createTestRider('pay-rider')
    const rideId = await createTestRide(riderId)

    const { data, error } = await supabase
      .from('payments')
      .insert({
        ride_id: rideId,
        rider_id: riderId,
        amount: 18.50,
        currency: 'usd',
        status: 'authorized',
        stripe_payment_intent_id: 'pi_test_123',
        payment_method: 'card',
        authorized_at: new Date().toISOString(),
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(Number(data!.amount)).toBe(18.5)
    expect(data!.status).toBe('authorized')
    expect(data!.currency).toBe('usd')
    expect(data!.stripe_payment_intent_id).toBe('pi_test_123')
    expect(data!.version).toBe(1)
    createdIds.push({ table: 'payments', id: data!.id })
  })

  it('payments table enforces valid status values', async () => {
    const { riderId } = await createTestRider('pay-status')
    const rideId = await createTestRide(riderId)

    const { error } = await supabase
      .from('payments')
      .insert({
        ride_id: rideId,
        rider_id: riderId,
        amount: 10.00,
        status: 'invalid_status',
      })

    expect(error).toBeTruthy()
  })

  it('ride_passes table accepts a subscription pass', async () => {
    const { riderId } = await createTestRider('pass-rider')

    const { data, error } = await supabase
      .from('ride_passes')
      .insert({
        rider_id: riderId,
        plan_name: '10 Rides Weekly',
        plan_description: '10 rides per week at a fixed rate',
        rides_total: 10,
        rides_remaining: 10,
        price_paid: 89.00,
        status: 'active',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.plan_name).toBe('10 Rides Weekly')
    expect(data!.rides_total).toBe(10)
    expect(data!.rides_remaining).toBe(10)
    expect(Number(data!.price_paid)).toBe(89)
    expect(data!.status).toBe('active')
    expect(data!.version).toBe(1)
    createdIds.push({ table: 'ride_passes', id: data!.id })
  })

  it('ride_passes enforces valid status values', async () => {
    const { riderId } = await createTestRider('pass-status')

    const { error } = await supabase
      .from('ride_passes')
      .insert({
        rider_id: riderId,
        plan_name: 'Bad Plan',
        rides_total: 5,
        rides_remaining: 5,
        price_paid: 50.00,
        status: 'bogus',
        expires_at: new Date().toISOString(),
      })

    expect(error).toBeTruthy()
  })

  it('fare_splits table accepts a split invitation between two riders', async () => {
    const { riderId: inviterId } = await createTestRider('split-inviter')
    const { riderId: inviteeId } = await createTestRider('split-invitee')
    const rideId = await createTestRide(inviterId)

    const { data, error } = await supabase
      .from('fare_splits')
      .insert({
        ride_id: rideId,
        inviter_id: inviterId,
        invitee_id: inviteeId,
        inviter_amount: 9.25,
        invitee_amount: 9.25,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(Number(data!.inviter_amount)).toBe(9.25)
    expect(Number(data!.invitee_amount)).toBe(9.25)
    expect(data!.status).toBe('pending')
    createdIds.push({ table: 'fare_splits', id: data!.id })
  })

  it('fare_splits enforces valid status values', async () => {
    const { riderId: inviterId } = await createTestRider('split-status-a')
    const { riderId: inviteeId } = await createTestRider('split-status-b')
    const rideId = await createTestRide(inviterId)

    const { error } = await supabase
      .from('fare_splits')
      .insert({
        ride_id: rideId,
        inviter_id: inviterId,
        invitee_id: inviteeId,
        inviter_amount: 5.00,
        invitee_amount: 5.00,
        status: 'bogus',
        expires_at: new Date().toISOString(),
      })

    expect(error).toBeTruthy()
  })

  it('fare_splits blocks invitees from changing split amounts', async () => {
    const { riderId: inviterId } = await createTestRider('split-guard-a')
    const { riderId: inviteeId, email: inviteeEmail } = await createTestRider('split-guard-b')
    const rideId = await createTestRide(inviterId)

    const { data: split, error: insertError } = await supabase
      .from('fare_splits')
      .insert({
        ride_id: rideId,
        inviter_id: inviterId,
        invitee_id: inviteeId,
        inviter_amount: 12.00,
        invitee_amount: 8.00,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    expect(insertError).toBeNull()
    createdIds.push({ table: 'fare_splits', id: split!.id })

    const inviteeClient = await createAuthenticatedRiderClient(inviteeEmail)
    const { error: updateError } = await inviteeClient
      .from('fare_splits')
      .update({
        inviter_amount: 1.00,
        invitee_amount: 19.00,
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', split!.id)

    expect(updateError).toBeTruthy()
  })
})
