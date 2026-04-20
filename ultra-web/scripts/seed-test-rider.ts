/**
 * Seed script: Create a test rider account in Supabase
 * Run: npx tsx scripts/seed-test-rider.ts
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

const RIDER = {
  email: 'rider1@ultra-app.test',
  password: 'UltraRider2026!',
  name: 'Maria Johnson',
  phone: '+1 (901) 555-0110',
}

async function seedRider() {
  console.log(`Seeding test rider: ${RIDER.email}\n`)

  const { data: existing } = await supabase.auth.admin.listUsers()
  const existingUser = existing?.users?.find((u) => u.email === RIDER.email)

  if (existingUser) {
    console.log(`  [skip] ${RIDER.email} — already exists (${existingUser.id})`)
    console.log(`\nCredentials: ${RIDER.email} / ${RIDER.password}`)
    return
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: RIDER.email,
    password: RIDER.password,
    email_confirm: true,
    user_metadata: { role: 'rider' },
  })

  if (authError || !authData.user) {
    console.error(`  [fail] Auth user — ${authError?.message}`)
    return
  }

  const userId = authData.user.id
  console.log(`  [done] Auth user created (${userId})`)

  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role: 'rider' })

  if (roleError) {
    console.error(`  [fail] Role insert — ${roleError.message}`)
    await supabase.auth.admin.deleteUser(userId)
    return
  }
  console.log(`  [done] Role assigned: rider`)

  const { error: riderError } = await supabase
    .from('riders')
    .insert({
      user_id: userId,
      name: RIDER.name,
      phone: RIDER.phone,
    })

  if (riderError) {
    console.error(`  [fail] Rider row — ${riderError.message}`)
    await supabase.from('user_roles').delete().eq('user_id', userId)
    await supabase.auth.admin.deleteUser(userId)
    return
  }
  console.log(`  [done] Rider profile created: ${RIDER.name}`)

  console.log(`\nRider seeding complete.`)
  console.log(`Credentials: ${RIDER.email} / ${RIDER.password}`)
}

seedRider().catch(console.error)
