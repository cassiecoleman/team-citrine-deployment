// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAvailablePasses, purchasePass } from "../actions";

describe("ride pass actions", () => {
  it("getAvailablePasses returns the plan catalog with correct shapes", async () => {
    const plans = await getAvailablePasses();

    expect(plans).toHaveLength(2);
    expect(plans[0]).toEqual(
      expect.objectContaining({
        id: "plan-5",
        tier: "weekly-5",
        ridesPerWeek: 5,
        pricePerWeek: 75,
        pricePerRide: 15,
        savingsPerWeek: 25,
        recommended: true,
      }),
    );
    expect(plans[1]).toEqual(
      expect.objectContaining({
        id: "plan-10",
        tier: "weekly-10",
        ridesPerWeek: 10,
        pricePerWeek: 140,
      }),
    );
  });

  it("purchasePass rejects unauthenticated users", async () => {
    const result = await purchasePass("plan-5");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to purchase a ride pass.",
    });
  });
});
