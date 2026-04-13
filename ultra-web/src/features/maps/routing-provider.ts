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
