export interface GeocodeLocation {
  address: string;
  lat: number;
  lng: number;
}

export class StubGeocodingProvider {
  async search(query: string): Promise<GeocodeLocation[]> {
    const normalized = query.trim().toLowerCase();

    if (normalized.includes("metro general hospital")) {
      return [
        {
          address: "Metro General Hospital, Memphis, TN",
          lat: 35.1151,
          lng: -89.9174,
        },
      ];
    }

    return [];
  }
}
