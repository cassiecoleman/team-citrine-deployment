export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceMiles: number;
  durationMinutes: number;
  coordinates: RoutePoint[];
}

export interface RoutingProvider {
  getRoute(origin: RoutePoint, destination: RoutePoint): Promise<RouteResult>;
  getEtaMinutes(origin: RoutePoint, destination: RoutePoint): Promise<number>;
}

export class StubRoutingProvider implements RoutingProvider {
  async getRoute(origin: RoutePoint, destination: RoutePoint): Promise<RouteResult> {
    return {
      distanceMiles: 8.1,
      durationMinutes: 19,
      coordinates: [origin, destination],
    };
  }

  async getEtaMinutes(): Promise<number> {
    return 19;
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

interface OSRMTableResponse {
  durations: number[][];
}

type FetchLike = typeof fetch;

export class OSRMRoutingProvider implements RoutingProvider {
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

  async getEtaMinutes(origin: RoutePoint, destination: RoutePoint): Promise<number> {
    const response = await this.fetchImpl(
      `https://router.project-osrm.org/table/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?sources=0&destinations=1`,
      {
        headers: {
          accept: "application/json",
        },
      },
    );
    const payload = (await response.json()) as OSRMTableResponse;
    const durationSeconds = payload.durations?.[0]?.[1];

    if (typeof durationSeconds !== "number" || Number.isNaN(durationSeconds)) {
      return 0;
    }

    return Math.round(durationSeconds / 60);
  }
}

export function createRoutingProvider(
  mode = process.env.NEXT_PUBLIC_ROUTING_PROVIDER ?? "stub",
): RoutingProvider {
  if (mode === "osrm") {
    return new OSRMRoutingProvider();
  }

  return new StubRoutingProvider();
}
