// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockRoleSingle = vi.fn();
const mockDriversOrder = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createServerAuthClient: () =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    }),
  createServiceRoleClient: () => ({
    from: (table: string) => {
      if (table === "user_roles") {
        return {
          select: () => ({
            eq: () => ({
              is: () => ({
                single: mockRoleSingle,
              }),
            }),
          }),
        };
      }

      if (table === "drivers") {
        return {
          select: () => ({
            is: () => ({
              order: mockDriversOrder,
            }),
          }),
        };
      }

      return {};
    },
  }),
}));

import { fetchDrivers } from "../actions";

describe("fetchDrivers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockReset();
    mockRoleSingle.mockReset();
    mockDriversOrder.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-03T10:05:00.000Z"));
  });

  it("returns live driver rows for an admin user", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "admin-1" } },
      error: null,
    });
    mockRoleSingle.mockResolvedValueOnce({
      data: { role: "admin" },
      error: null,
    });
    mockDriversOrder.mockResolvedValueOnce({
      data: [
        {
          id: "driver-1",
          name: "Marcus Bell",
          status: "available",
          rating: 4.9,
          updated_at: "2026-05-03T10:00:00.000Z",
        },
        {
          id: "driver-2",
          name: "Nina Jones",
          status: "offline",
          rating: 4.7,
          updated_at: "2026-05-03T09:00:00.000Z",
        },
      ],
      error: null,
    });

    const result = await fetchDrivers();

    expect(result).toEqual([
      {
        id: "driver-1",
        name: "Marcus Bell",
        status: "Active",
        rating: 4.9,
        lastActive: "5m ago",
      },
      {
        id: "driver-2",
        name: "Nina Jones",
        status: "Offline",
        rating: 4.7,
        lastActive: "1h ago",
      },
    ]);
  });
});
