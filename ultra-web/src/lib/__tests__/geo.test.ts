import { describe, expect, it } from "vitest";

import { haversineMiles } from "../geo";

describe("haversineMiles", () => {
  it("returns 0 for identical points", () => {
    expect(haversineMiles(35.1495, -90.049, 35.1495, -90.049)).toBe(0);
  });

  it("returns the great-circle distance between two Memphis points (~4.9 mi)", () => {
    const distance = haversineMiles(35.1495, -90.049, 35.1174, -89.9711);
    expect(distance).toBeCloseTo(4.93, 1);
  });

  it("is symmetric (a→b equals b→a)", () => {
    const ab = haversineMiles(35.1495, -90.049, 35.1174, -89.9711);
    const ba = haversineMiles(35.1174, -89.9711, 35.1495, -90.049);
    expect(ab).toBeCloseTo(ba, 9);
  });
});
