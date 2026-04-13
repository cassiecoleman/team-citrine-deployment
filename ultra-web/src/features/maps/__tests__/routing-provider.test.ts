import { describe, expect, it } from "vitest";
import { StubRoutingProvider } from "../routing-provider";

describe("StubRoutingProvider", () => {
  it("returns a simple route shape with stub ETA", async () => {
    const provider = new StubRoutingProvider();

    const route = await provider.getRoute(
      { lat: 35.1495, lng: -90.049 },
      { lat: 35.1151, lng: -89.9174 },
    );

    expect(route).toEqual({
      distanceMiles: 8.1,
      durationMinutes: 19,
      coordinates: [
        { lat: 35.1495, lng: -90.049 },
        { lat: 35.1151, lng: -89.9174 },
      ],
    });
  });
});
