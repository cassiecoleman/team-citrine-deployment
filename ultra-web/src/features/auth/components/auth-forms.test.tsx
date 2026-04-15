// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm, validateLoginInput } from './LoginForm'
import { RegisterForm, validateRegisterInput } from './RegisterForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('../actions', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}))

describe('auth forms', () => {
  it('renders login form fields and register link', () => {
    const html = renderToStaticMarkup(<LoginForm />)

    expect(html).toContain('name="email"')
    expect(html).toContain('name="password"')
    expect(html).toContain('>Sign In<')
    expect(html).toContain('href="/register"')
  })

  it('renders register form fields and login link', () => {
    const html = renderToStaticMarkup(<RegisterForm />)

    expect(html).toContain('name="email"')
    expect(html).toContain('name="password"')
    expect(html).toContain('name="confirmPassword"')
    expect(html).toContain('>Create Account<')
    expect(html).toContain('href="/login"')
  })

  it('validates login input before server action call', () => {
    expect(validateLoginInput('', 'password123')).toBe('Invalid email address')
    expect(validateLoginInput('rider@example.com', '123')).toBe('Password must be at least 8 characters')
    expect(validateLoginInput('rider@example.com', 'password123')).toBeNull()
  })

  it('validates register input before server action call', () => {
    expect(validateRegisterInput('rider@example.com', 'password123', 'different123')).toBe(
      'Passwords do not match'
    )
    expect(validateRegisterInput('invalid-email', 'password123', 'password123')).toBe(
      'Invalid email address'
    )
    expect(validateRegisterInput('rider@example.com', '123', '123')).toBe(
      'Password must be at least 8 characters'
    )
    expect(validateRegisterInput('rider@example.com', 'password123', 'password123')).toBeNull()
  })
})
