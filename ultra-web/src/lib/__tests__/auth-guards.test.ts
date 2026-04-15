// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockGetUser,
  mockRoleSelect,
  mockRoleEq,
  mockRoleIs,
  mockRoleSingle,
  mockFrom,
  mockCreateServerAuthClient,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockRoleSelect: vi.fn(),
  mockRoleEq: vi.fn(),
  mockRoleIs: vi.fn(),
  mockRoleSingle: vi.fn(),
  mockFrom: vi.fn(),
  mockCreateServerAuthClient: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerAuthClient: mockCreateServerAuthClient,
}))

import {
  UnauthorizedError,
  getCurrentUserAndRole,
  requireRole,
} from '@/lib/auth-guards'

describe('auth guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockRoleSingle.mockResolvedValue({
      data: { role: 'driver' },
      error: null,
    })
    mockRoleIs.mockReturnValue({ single: mockRoleSingle })
    mockRoleEq.mockReturnValue({ is: mockRoleIs })
    mockRoleSelect.mockReturnValue({ eq: mockRoleEq })
    mockFrom.mockReturnValue({ select: mockRoleSelect })

    mockCreateServerAuthClient.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    })
  })

  it('uses the server auth client and returns current user role', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const result = await getCurrentUserAndRole()

    expect(mockCreateServerAuthClient).toHaveBeenCalledOnce()
    expect(mockRoleSelect).toHaveBeenCalledWith('role')
    expect(mockRoleEq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(mockRoleIs).toHaveBeenCalledWith('deleted_at', null)
    expect(result).toEqual({ userId: 'user-1', role: 'driver' })
  })

  it('throws when role is not allowed', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    await expect(requireRole('admin')).rejects.toBeInstanceOf(UnauthorizedError)
  })
})
