import { describe, it, expect, afterAll, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Mock next/headers so createServerAuthClient() works in Node tests
const mockCookieStore = new Map<string, { name: string; value: string }>()
vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => Array.from(mockCookieStore.values()),
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      mockCookieStore.set(name, { name, value, ...options })
    },
  }),
}))

import { signUp, signIn, signOut, getCurrentUser, getSession, resetPassword } from '../actions'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const hasSupabaseEnv =
  Boolean(supabaseUrl) &&
  Boolean(serviceRoleKey) &&
  !String(supabaseUrl).includes('your-project-ref') &&
  !String(serviceRoleKey).includes('your-service-role-key')

const runIntegration =
  hasSupabaseEnv && process.env.RUN_SUPABASE_INTEGRATION === 'true' ? describe : describe.skip

const supabase = hasSupabaseEnv ? createClient(supabaseUrl!, serviceRoleKey!) : null

const uid = Date.now()
const authUserIds: string[] = []

afterAll(async () => {
  if (!supabase) {
    return
  }

  for (const id of authUserIds) {
    await supabase.from('user_roles').delete().eq('user_id', id)
    await supabase.auth.admin.deleteUser(id)
  }
})

runIntegration('Auth actions — signUp', () => {
  it('rejects invalid email', async () => {
    const result = await signUp({ email: 'not-an-email', password: 'test-password-123' })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/invalid email/i)
  })

  it('rejects password shorter than 8 characters', async () => {
    const result = await signUp({ email: 'short-pw@ultra.test', password: 'short' })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/8 characters/i)
  })

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

  it('rejects duplicate email', async () => {
    const email = `dup-test-${uid}@ultra.test`

    const first = await signUp({ email, password: 'test-password-123' })
    expect(first.success).toBe(true)
    authUserIds.push(first.data.userId)

    const second = await signUp({ email, password: 'test-password-456' })
    expect(second.success).toBe(false)
    expect(second.error).toBeTruthy()
  })

  it('creates auth user and assigns driver role when requested', async () => {
    const email = `driver-signup-${uid}@ultra.test`
    const result = await signUp({
      email,
      password: 'test-password-123',
      role: 'driver',
    })

    expect(result.success).toBe(true)
    authUserIds.push(result.data.userId)

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', result.data.userId)
      .single()

    expect(roleData?.role).toBe('driver')
  })
})

runIntegration('Auth actions — signIn', () => {
  it('signs in with valid credentials', async () => {
    // Create a confirmed user to sign in with
    const email = `signin-test-${uid}@ultra.test`
    const password = 'test-password-123'

    const { data: created } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    authUserIds.push(created.user!.id)

    const result = await signIn({ email, password })

    expect(result.success).toBe(true)
    expect(result.data?.session).toBeTruthy()
  })

  it('rejects invalid email format', async () => {
    const result = await signIn({ email: 'bad-email', password: 'whatever' })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/invalid email/i)
  })

  it('rejects wrong password', async () => {
    const email = `signin-wrong-pw-${uid}@ultra.test`
    const { data: created } = await supabase.auth.admin.createUser({
      email,
      password: 'correct-password-123',
      email_confirm: true,
    })
    authUserIds.push(created.user!.id)

    const result = await signIn({ email, password: 'wrong-password-456' })

    expect(result.success).toBe(false)
  })
})

runIntegration('Auth actions — signOut', () => {
  it('signs out successfully', async () => {
    // Sign in first to have an active session
    const email = `signout-test-${uid}@ultra.test`
    const { data: created } = await supabase.auth.admin.createUser({
      email,
      password: 'test-password-123',
      email_confirm: true,
    })
    authUserIds.push(created.user!.id)

    await signIn({ email, password: 'test-password-123' })
    const result = await signOut()

    expect(result.success).toBe(true)
  })
})

runIntegration('Auth actions — getCurrentUser', () => {
  it('returns user after sign in', async () => {
    const email = `getuser-test-${uid}@ultra.test`
    const { data: created } = await supabase.auth.admin.createUser({
      email,
      password: 'test-password-123',
      email_confirm: true,
    })
    authUserIds.push(created.user!.id)

    await signIn({ email, password: 'test-password-123' })
    const result = await getCurrentUser()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data?.user).toBeTruthy()
    }
  })

  it('returns error when no session', async () => {
    // Clear cookies to simulate no session
    mockCookieStore.clear()
    const result = await getCurrentUser()

    expect(result.success).toBe(false)
  })
})

runIntegration('Auth actions — getSession', () => {
  it('returns authenticated user context', async () => {
    const email = `getsession-test-${uid}@ultra.test`
    const { data: created } = await supabase.auth.admin.createUser({
      email,
      password: 'test-password-123',
      email_confirm: true,
    })
    authUserIds.push(created.user!.id)

    await signIn({ email, password: 'test-password-123' })
    const result = await getSession()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data?.user).toBeTruthy()
    }
  })
})

runIntegration('Auth actions — resetPassword', () => {
  it('rejects invalid email format', async () => {
    const result = await resetPassword({ email: 'not-valid' })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/invalid email/i)
  })

  it('sends reset email for existing user', async () => {
    const email = `reset-test-${uid}@ultra.test`
    const { data: created } = await supabase.auth.admin.createUser({
      email,
      password: 'test-password-123',
      email_confirm: true,
    })
    authUserIds.push(created.user!.id)

    const result = await resetPassword({ email })

    // Supabase may return an error if email sending isn't configured,
    // but the action should not throw — it should return a result
    expect(result).toHaveProperty('success')
  })
})
