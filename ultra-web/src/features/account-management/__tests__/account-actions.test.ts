// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle, eq: mockEq }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn((table: string) => {
  if (table === "riders") {
    return { select: mockSelect };
  }
  if (table === "rider_profiles") {
    return { select: mockSelect };
  }
  return {};
});

vi.mock("@/lib/supabase-server", () => ({
  createServerAuthClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    }),
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

import { getParentAccount, getChildProfiles } from "../actions";

describe("account management actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockGetUser.mockReset();
    mockEq.mockClear();
    mockEq.mockReturnValue({ single: mockSingle, eq: mockEq });
    mockSelect.mockClear();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockClear();
  });

  it("getParentAccount returns real user data when authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1", email: "jacob@example.com" } },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: { id: "rider-1", user_id: "user-1", name: "Jacob", phone: "+15551234567" },
      error: null,
    });

    const result = await getParentAccount();

    expect(result.name).toBe("Jacob");
    expect(result.email).toBe("jacob@example.com");
    expect(result.phone).toBe("+15551234567");
  });

  it("getParentAccount returns fallback when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "not authenticated" },
    });

    const result = await getParentAccount();

    // Should still return something (mock fallback) so page doesn't crash
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("email");
  });

  it("getChildProfiles returns empty array when no children exist", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: { id: "rider-1" },
      error: null,
    });
    // rider_profiles query returns empty
    mockEq.mockReturnValueOnce({ data: [], error: null });

    const result = await getChildProfiles();

    expect(result).toEqual([]);
  });
});
