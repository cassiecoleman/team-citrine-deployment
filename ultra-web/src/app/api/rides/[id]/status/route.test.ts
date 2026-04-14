import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, getRideStatus, matchDriver } = vi.hoisted(() => ({
  getUser: vi.fn(),
  getRideStatus: vi.fn(),
  matchDriver: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser,
    },
  })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
  })),
}));

vi.mock("@/features/ride-tracking/actions", () => ({
  getRideStatus,
}));

vi.mock("@/features/ride-scheduling/actions", () => ({
  matchDriver,
}));

import { GET } from "./route";

describe("GET /api/rides/[id]/status", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    getUser.mockReset();
    getRideStatus.mockReset();
    matchDriver.mockReset();
  });

  it("returns 401 when no authenticated user is present", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "ride-1" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(getRideStatus).not.toHaveBeenCalled();
  });

  it("returns ride status for authenticated users", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    getRideStatus.mockResolvedValue({
      id: "ride-1",
      status: "matching",
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "ride-1" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "ride-1",
      status: "matching",
    });
    expect(getRideStatus).toHaveBeenCalledWith("ride-1");
  });

  it("tries to match a driver when the ride is still in matching status", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    getRideStatus.mockResolvedValue({
      id: "ride-1",
      status: "matching",
    });
    matchDriver.mockResolvedValue({
      success: true,
      data: {
        id: "ride-1",
        status: "driver_en_route",
        driverId: "driver-1",
      },
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "ride-1" }),
    });

    expect(matchDriver).toHaveBeenCalledWith("ride-1");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "ride-1",
      status: "driver_en_route",
    });
  });
});
