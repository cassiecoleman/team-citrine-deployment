import { describe, expect, it, vi } from "vitest";

import { ensureSeededRiderRows } from "../seed-test-rider";

describe("ensureSeededRiderRows", () => {
  it("repairs missing rider seed rows for an existing auth user", async () => {
    const roleUpsert = vi.fn().mockResolvedValue({ error: null });
    const riderUpsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "user_roles") {
        return { upsert: roleUpsert };
      }

      if (table === "riders") {
        return { upsert: riderUpsert };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await ensureSeededRiderRows(
      { from } as never,
      "user-123",
      {
        name: "Maria Johnson",
        phone: "+1 (901) 555-0110",
      }
    );

    expect(result).toEqual({ success: true });
    expect(roleUpsert).toHaveBeenCalledWith(
      { user_id: "user-123", role: "rider" },
      { onConflict: "user_id" }
    );
    expect(riderUpsert).toHaveBeenCalledWith(
      {
        user_id: "user-123",
        name: "Maria Johnson",
        phone: "+1 (901) 555-0110",
      },
      { onConflict: "user_id" }
    );
  });
});
