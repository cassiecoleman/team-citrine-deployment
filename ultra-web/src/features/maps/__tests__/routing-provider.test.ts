import { describe, expect, it } from "vitest";
import { OSRMRoutingProvider, StubRoutingProvider } from "../routing-provider";

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

describe("OSRMRoutingProvider", () => {
  it("parses route distance, duration, and geometry from OSRM", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        routes: [
          {
            distance: 13000,
            duration: 1200,
            geometry: {
              coordinates: [
                [-90.049, 35.1495],
                [-89.9174, 35.1151],
              ],
            },
          },
        ],
      }),
    );
    const provider = new OSRMRoutingProvider(fetchMock);

    const route = await provider.getRoute(
      { lat: 35.1495, lng: -90.049 },
      { lat: 35.1151, lng: -89.9174 },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://router.project-osrm.org/route/v1/driving/-90.049,35.1495;-89.9174,35.1151?overview=full&geometries=geojson",
      expect.any(Object),
    );
    expect(route).toEqual({
      distanceMiles: 8.1,
      durationMinutes: 20,
      coordinates: [
        { lat: 35.1495, lng: -90.049 },
        { lat: 35.1151, lng: -89.9174 },
      ],
    });
  });
});
