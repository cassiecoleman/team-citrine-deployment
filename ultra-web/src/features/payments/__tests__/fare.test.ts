import { describe, expect, it } from "vitest";
import { calculateFare } from "../fare";

describe("calculateFare", () => {
  it("sums base fare + per-mile + per-minute + service fee in cents", () => {
    const result = calculateFare({ distanceMiles: 4, durationMinutes: 10 });

    // base $2.50 + 4 * $1.50 + 10 * $0.25 + $1.00 service fee = $12.00 = 1200 cents
    expect(result.totalCents).toBe(1200);
    expect(result.baseCents).toBe(250);
    expect(result.distanceCents).toBe(600);
    expect(result.timeCents).toBe(250);
    expect(result.serviceFeeCents).toBe(100);
  });
});
