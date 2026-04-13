import { describe, expect, it } from "vitest";
import { StubGeocodingProvider } from "../geocoding-provider";

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
