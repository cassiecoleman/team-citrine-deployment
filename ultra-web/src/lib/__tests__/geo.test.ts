import { afterEach, describe, expect, it, vi } from "vitest";

import { geocodeAddress, haversineMiles } from "../geo";

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

describe("geocodeAddress", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns lat/lng/displayName for a Memphis address from Nominatim", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "35.1495",
          lon: "-90.049",
          display_name: "1150 West End Ave, Memphis, TN, USA",
        },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await geocodeAddress("1150 West End Ave, Memphis, TN");

    expect(result).toEqual({
      lat: 35.1495,
      lng: -90.049,
      displayName: "1150 West End Ave, Memphis, TN, USA",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("https://nominatim.openstreetmap.org/search");
    expect(String(url)).toContain("format=json");
    expect(String(url)).toContain("1150");
    expect(init?.headers?.["User-Agent"]).toMatch(/ultra/i);
  });

  it("returns null when Nominatim has no results", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await geocodeAddress("nowhereville xyz");
    expect(result).toBeNull();
  });

  it("returns null on a non-OK response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal("fetch", fetchMock);

    const result = await geocodeAddress("1150 West End Ave");
    expect(result).toBeNull();
  });
});
