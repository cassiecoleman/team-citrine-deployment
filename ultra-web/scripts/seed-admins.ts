/**
 * Seed script: Create 3 admin accounts in Supabase
 * Run: npx tsx scripts/seed-admins.ts
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

const ADMIN_ACCOUNTS = [
  { email: 'admin1@ultra-app.test', name: 'Admin One' },
  { email: 'admin2@ultra-app.test', name: 'Admin Two' },
  { email: 'admin3@ultra-app.test', name: 'Admin Three' },
]

const DEFAULT_PASSWORD = 'UltraAdmin2026!'

async function seedAdmins() {
  console.log('Seeding 3 admin accounts...\n')

  for (const account of ADMIN_ACCOUNTS) {
    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.listUsers()
    const existingUser = existing?.users?.find((u) => u.email === account.email)

    if (existingUser) {
      console.log(`  [skip] ${account.email} — already exists (${existingUser.id})`)

      // Ensure role exists
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', existingUser.id)
        .single()

      if (!roleData) {
        await supabase.from('user_roles').insert({
          user_id: existingUser.id,
          role: 'admin',
        })
        console.log(`         → added missing admin role`)
      }
      continue
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: account.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error(`  [fail] ${account.email} — ${authError?.message}`)
      continue
    }

    const userId = authData.user.id

    // Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' })

    if (roleError) {
      console.error(`  [fail] ${account.email} — role insert: ${roleError.message}`)
      await supabase.auth.admin.deleteUser(userId)
      continue
    }

    console.log(`  [done] ${account.email} (${userId})`)
  }

  console.log('\nAdmin seeding complete.')
  console.log(`Default password: ${DEFAULT_PASSWORD}`)
}

seedAdmins().catch(console.error)
