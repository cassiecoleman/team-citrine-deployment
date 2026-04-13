import { describe, expect, it } from "vitest";
import { NominatimGeocodingProvider, StubGeocodingProvider } from "../geocoding-provider";

describe("StubGeocodingProvider", () => {
  it("resolves a known Memphis destination", async () => {
    const provider = new StubGeocodingProvider();

    const result = await provider.search("Metro General Hospital");

    expect(result).toEqual([
      {
        address: "Metro General Hospital, Memphis, TN",
        lat: 35.1151,
        lng: -89.9174,
      },
    ]);
  });
});

describe("NominatimGeocodingProvider", () => {
  it("normalizes API results into geocode locations", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json([
        {
          display_name: "Union Ave, Memphis, TN, USA",
          lat: "35.1374",
          lon: "-90.0342",
        },
      ]),
    );
    const provider = new NominatimGeocodingProvider(fetchMock);

    const result = await provider.search("Union Ave");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://nominatim.openstreetmap.org/search?format=json&limit=5&q=Union%20Ave",
      expect.objectContaining({
        headers: {
          accept: "application/json",
        },
      }),
    );
    expect(result).toEqual([
      {
        address: "Union Ave, Memphis, TN, USA",
        lat: 35.1374,
        lng: -90.0342,
      },
    ]);
  });
});
