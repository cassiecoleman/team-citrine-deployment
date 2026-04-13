import { describe, it, expect, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { signUp } from '../actions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const uid = Date.now()
const authUserIds: string[] = []

afterAll(async () => {
  for (const id of authUserIds) {
    await supabase.from('user_roles').delete().eq('user_id', id)
    await supabase.auth.admin.deleteUser(id)
  }
})

describe('Auth actions — signUp', () => {
  it('creates auth user and assigns rider role', async () => {
    const email = `signup-test-${uid}@ultra.test`
    const result = await signUp({ email, password: 'test-password-123' })

    expect(result.success).toBe(true)
    expect(result.data?.userId).toBeTruthy()
    expect(result.data?.email).toBe(email)

    authUserIds.push(result.data.userId)

    // Verify role was created in user_roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', result.data.userId)
      .single()

    expect(roleData?.role).toBe('rider')
  })
})
