// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  canAccessPath,
  getRequiredRoleForPath,
  isPublicRoute,
  roleHomePaths,
} from '../../../middleware'

describe('middleware route guards', () => {
  it('treats auth pages as public', () => {
    expect(isPublicRoute('/login')).toBe(true)
    expect(isPublicRoute('/register')).toBe(true)
    expect(isPublicRoute('/book')).toBe(false)
    expect(isPublicRoute('/')).toBe(false)
  })

  it('maps real app routes to the expected required role', () => {
    expect(getRequiredRoleForPath('/queue')).toBe('driver')
    expect(getRequiredRoleForPath('/trip/trip-1')).toBe('driver')
    expect(getRequiredRoleForPath('/trip/trip-1/pickup')).toBe('driver')
    expect(getRequiredRoleForPath('/ride/ride-1')).toBe('rider')
    expect(getRequiredRoleForPath('/ride/ride-1/complete')).toBe('rider')
    expect(getRequiredRoleForPath('/receipt')).toBe('rider')
    expect(getRequiredRoleForPath('/admin/rides')).toBe('admin')
  })

  it('allows admin access to all protected route groups', () => {
    expect(canAccessPath('admin', '/queue')).toBe(true)
    expect(canAccessPath('admin', '/trip/trip-1/pickup')).toBe(true)
    expect(canAccessPath('admin', '/ride/ride-1/complete')).toBe(true)
    expect(canAccessPath('admin', '/admin/rides')).toBe(true)
  })

  it('uses existing in-app fallback paths', () => {
    expect(roleHomePaths.rider).toBe('/')
    expect(roleHomePaths.driver).toBe('/driver')
    expect(roleHomePaths.admin).toBe('/admin')
  })
})
