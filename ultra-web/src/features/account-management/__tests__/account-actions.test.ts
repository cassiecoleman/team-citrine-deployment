// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockIs = vi.fn(() => ({ single: mockSingle }));
const mockEq = vi.fn(() => ({ single: mockSingle, eq: mockEq, is: mockIs }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));

// Update / insert / delete paths resolve as promises instead of chainables.
const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockInsert = vi.fn();
const mockDeleteEq = vi.fn();
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));
const mockUpsert = vi.fn();

const mockFrom = vi.fn((table: string) => {
  if (table === "riders") {
    return { select: mockSelect, update: mockUpdate };
  }
  if (table === "rider_profiles") {
    return {
      select: mockSelect,
      update: mockUpdate,
      insert: mockInsert,
      delete: mockDelete,
    };
  }
  if (table === "notification_preferences") {
    return { select: mockSelect, update: mockUpdate, insert: mockInsert, upsert: mockUpsert };
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

import {
  getParentAccount,
  getChildProfiles,
  updateParentAccount,
  createChildProfile,
  updateChildProfile,
  deleteChildProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../actions";

describe("account management actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockGetUser.mockReset();
    mockIs.mockClear();
    mockIs.mockReturnValue({ single: mockSingle });
    mockEq.mockClear();
    mockEq.mockReturnValue({ single: mockSingle, eq: mockEq, is: mockIs });
    mockSelect.mockClear();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockClear();
    mockUpdateEq.mockReset();
    mockUpdate.mockClear();
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });
    mockInsert.mockReset();
    mockDeleteEq.mockReset();
    mockDelete.mockClear();
    mockDelete.mockReturnValue({ eq: mockDeleteEq });
    mockUpsert.mockReset();
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
    mockEq.mockReturnValueOnce({ data: [], error: null } as any);

    const result = await getChildProfiles();

    expect(result).toEqual([]);
  });

  it("updateParentAccount updates the caller's rider row scoped by user_id", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockUpdateEq.mockResolvedValueOnce({ data: null, error: null });

    const result = await updateParentAccount({
      name: "New Name",
      phone: "+15550000000",
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith("riders");
    expect(mockUpdate).toHaveBeenCalledWith({
      name: "New Name",
      phone: "+15550000000",
    });
    expect(mockUpdateEq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("updateParentAccount rejects unauthenticated callers", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "no session" },
    });

    const result = await updateParentAccount({ name: "N", phone: "P" });

    expect(result.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("createChildProfile inserts a rider_profiles row for the caller's rider", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    // riders lookup for rider_id
    mockSingle.mockResolvedValueOnce({
      data: { id: "rider-1" },
      error: null,
    });
    mockInsert.mockResolvedValueOnce({ data: null, error: null });

    const result = await createChildProfile({
      name: "Emma",
      emergencyContactName: "Rosa M.",
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith("rider_profiles");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rider_id: "rider-1",
        name: "Emma",
        is_child: true,
        notes: "Rosa M.",
      })
    );
  });

  it("createChildProfile rejects when the caller has no rider profile", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-no-rider" } },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "not found" },
    });

    const result = await createChildProfile({ name: "X" });

    expect(result.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("updateChildProfile updates a child profile owned by the caller", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    // rider lookup
    mockSingle.mockResolvedValueOnce({
      data: { id: "rider-1" },
      error: null,
    });
    // ownership check: the profile exists and belongs to rider-1
    mockSingle.mockResolvedValueOnce({
      data: { id: "cp-1", rider_id: "rider-1" },
      error: null,
    });
    mockUpdateEq.mockResolvedValueOnce({ data: null, error: null });

    const result = await updateChildProfile({
      id: "cp-1",
      name: "Emma R.",
      emergencyContactName: "Rosa M.",
    });

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Emma R.", notes: "Rosa M." })
    );
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "cp-1");
  });

  it("updateChildProfile refuses to update a profile the caller doesn't own", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: { id: "rider-1" },
      error: null,
    });
    // Profile belongs to someone else
    mockSingle.mockResolvedValueOnce({
      data: { id: "cp-other", rider_id: "rider-2" },
      error: null,
    });

    const result = await updateChildProfile({ id: "cp-other", name: "Hack" });

    expect(result.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("deleteChildProfile removes a child profile owned by the caller", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: { id: "rider-1" },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: { id: "cp-1", rider_id: "rider-1" },
      error: null,
    });
    mockDeleteEq.mockResolvedValueOnce({ data: null, error: null });

    const result = await deleteChildProfile("cp-1");

    expect(result).toEqual({ success: true });
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "cp-1");
  });

  it("deleteChildProfile refuses to delete a profile the caller doesn't own", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: { id: "rider-1" },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: { id: "cp-other", rider_id: "rider-2" },
      error: null,
    });

    const result = await deleteChildProfile("cp-other");

    expect(result.success).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("getNotificationPreferences returns the caller's row", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: {
        user_id: "user-1",
        sms_enabled: true,
        push_enabled: false,
        email_enabled: true,
      },
      error: null,
    });

    const result = await getNotificationPreferences();

    expect(result).toEqual({
      smsEnabled: true,
      pushEnabled: false,
      emailEnabled: true,
    });
  });

  it("getNotificationPreferences returns defaults when no row exists", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-no-prefs" } },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "row not found" },
    });

    const result = await getNotificationPreferences();

    // All defaults true — matches migration defaults.
    expect(result).toEqual({
      smsEnabled: true,
      pushEnabled: true,
      emailEnabled: true,
    });
  });

  it("updateNotificationPreferences uses atomic upsert", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockUpsert.mockResolvedValueOnce({ data: null, error: null });

    const result = await updateNotificationPreferences({
      smsEnabled: false,
      pushEnabled: true,
      emailEnabled: false,
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith("notification_preferences");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        sms_enabled: false,
        push_enabled: true,
        email_enabled: false,
      }),
      { onConflict: "user_id" },
    );
  });

  it("ownership guard rejects non-child profiles", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      // Profile query returns null because is_child filter excludes it
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

    const result = await updateChildProfile({ id: "adult-profile", name: "Hack" });

    expect(result.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("ownership guard rejects soft-deleted profiles", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSingle
      .mockResolvedValueOnce({ data: { id: "rider-1" }, error: null })
      // Profile query returns null because deleted_at IS NULL filter excludes it
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

    const result = await deleteChildProfile("deleted-profile");

    expect(result.success).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
