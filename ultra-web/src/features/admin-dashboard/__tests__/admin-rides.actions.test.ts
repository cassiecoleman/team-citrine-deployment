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
      if (table === 'user_roles') {
        return {
          select: () => ({
            eq: () => ({
              is: () => ({
                single: mockRoleSingle,
              }),
            }),
          }),
        }
      }

      return {
        select: () => ({
          is: () => ({
            in: () => ({
              order: () => ({ data: [], error: null }),
            }),
            eq: () => ({
              order: () => ({ data: [], error: null }),
            }),
          }),
        }),
      }
    },
  }),
}))

import { getActiveRides } from '../rides-actions'

describe('admin rides actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockReset()
    mockRoleSingle.mockReset()
  })

  it('rejects non-admin users', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockRoleSingle.mockResolvedValueOnce({
      data: { role: 'rider' },
      error: null,
    })

    await expect(getActiveRides({})).rejects.toThrow('Forbidden')
  })
})
