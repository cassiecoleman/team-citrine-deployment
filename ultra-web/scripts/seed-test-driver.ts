/**
 * Seed script: Create a test driver account in Supabase
 * Run: npx tsx scripts/seed-test-driver.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const DRIVER = {
  email: 'driver1@ultra-app.test',
  password: 'UltraDriver2026!',
  name: 'Marcus Bell',
  phone: '+1 (901) 555-0101',
  vehicle_make: 'Toyota',
  vehicle_model: 'Camry',
  vehicle_year: 2023,
  vehicle_color: 'Silver',
  license_plate: 'TN-ULTRA-01',
  is_child_safe: true,
}

async function seedDriver() {
  console.log(`Seeding test driver: ${DRIVER.email}\n`)

  // Check if already exists
  const { data: existing } = await supabase.auth.admin.listUsers()
  const existingUser = existing?.users?.find((u) => u.email === DRIVER.email)

  if (existingUser) {
    console.log(`  [skip] ${DRIVER.email} — already exists (${existingUser.id})`)
    console.log(`\nCredentials: ${DRIVER.email} / ${DRIVER.password}`)
    return
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: DRIVER.email,
    password: DRIVER.password,
    email_confirm: true,
    user_metadata: { role: 'driver' },
  })

  if (authError || !authData.user) {
    console.error(`  [fail] Auth user — ${authError?.message}`)
    return
  }

  const userId = authData.user.id
  console.log(`  [done] Auth user created (${userId})`)

  // Assign driver role
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role: 'driver' })

  if (roleError) {
    console.error(`  [fail] Role insert — ${roleError.message}`)
    await supabase.auth.admin.deleteUser(userId)
    return
  }
  console.log(`  [done] Role assigned: driver`)

  // Create drivers row
  const { error: driverError } = await supabase
    .from('drivers')
    .insert({
      user_id: userId,
      name: DRIVER.name,
      phone: DRIVER.phone,
      vehicle_make: DRIVER.vehicle_make,
      vehicle_model: DRIVER.vehicle_model,
      vehicle_year: DRIVER.vehicle_year,
      vehicle_color: DRIVER.vehicle_color,
      license_plate: DRIVER.license_plate,
      is_child_safe: DRIVER.is_child_safe,
      status: 'available',
    })

  if (driverError) {
    console.error(`  [fail] Driver row — ${driverError.message}`)
    await supabase.from('user_roles').delete().eq('user_id', userId)
    await supabase.auth.admin.deleteUser(userId)
    return
  }
  console.log(`  [done] Driver profile created: ${DRIVER.name}`)

  console.log(`\nDriver seeding complete.`)
  console.log(`Credentials: ${DRIVER.email} / ${DRIVER.password}`)
  console.log(`Vehicle: ${DRIVER.vehicle_color} ${DRIVER.vehicle_year} ${DRIVER.vehicle_make} ${DRIVER.vehicle_model} (${DRIVER.license_plate})`)
}

seedDriver().catch(console.error)
