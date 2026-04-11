// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createRide } from "../actions";

describe("ride scheduling actions", () => {
  it("returns an auth error when creating an immediate ride without a user context", async () => {
    const result = await createRide({
      pickup: { lat: 35.1495, lng: -90.049, address: "123 Beale St, Memphis, TN" },
      dropoff: {
        lat: 35.1174,
        lng: -89.9711,
        address: "456 Elvis Presley Blvd, Memphis, TN",
      },
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to request a ride.",
    });
  });
});
