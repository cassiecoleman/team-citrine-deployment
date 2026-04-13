export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceMiles: number;
  durationMinutes: number;
  coordinates: RoutePoint[];
}

export class StubRoutingProvider {
  async getRoute(origin: RoutePoint, destination: RoutePoint): Promise<RouteResult> {
    return {
      distanceMiles: 8.1,
      durationMinutes: 19,
      coordinates: [origin, destination],
    };
  }
}

interface OSRMRouteResponse {
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
}

type FetchLike = typeof fetch;

export class OSRMRoutingProvider {
  constructor(private readonly fetchImpl: FetchLike = fetch) {}

  async getRoute(origin: RoutePoint, destination: RoutePoint): Promise<RouteResult> {
    const response = await this.fetchImpl(
      `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`,
      {
        headers: {
          accept: "application/json",
        },
      },
    );
    const payload = (await response.json()) as OSRMRouteResponse;
    const route = payload.routes[0];

    return {
      distanceMiles: Number((route.distance / 1609.34).toFixed(1)),
      durationMinutes: Math.round(route.duration / 60),
      coordinates: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    };
  }
}
