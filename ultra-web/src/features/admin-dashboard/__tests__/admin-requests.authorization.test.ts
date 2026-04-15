// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetUser = vi.fn()
const mockRoleSingle = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  createServerAuthClient: () =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    }),
  createServiceRoleClient: () => ({
    from: (table: string) => {
      if (table !== 'user_roles') {
        return {}
      }

      return {
        select: () => ({
          eq: () => ({
            is: () => ({
              single: mockRoleSingle,
            }),
          }),
        }),
      }
    },
  }),
}))

import { fetchAdminRequests } from '../requests-actions'

describe('fetchAdminRequests authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockReset()
    mockRoleSingle.mockReset()
  })

  it('throws Forbidden when user does not have an admin role', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockRoleSingle.mockResolvedValueOnce({
      data: { role: 'rider' },
      error: null,
    })

    await expect(fetchAdminRequests({})).rejects.toThrow('Forbidden')
  })
})
