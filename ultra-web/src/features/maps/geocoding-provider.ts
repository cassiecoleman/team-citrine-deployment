export interface GeocodeLocation {
  address: string;
  lat: number;
  lng: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
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

type FetchLike = typeof fetch;

export class NominatimGeocodingProvider {
  constructor(private readonly fetchImpl: FetchLike = fetch) {}

  async search(query: string): Promise<GeocodeLocation[]> {
    const encodedQuery = encodeURIComponent(query.trim());
    const response = await this.fetchImpl(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodedQuery}`,
      {
        headers: {
          accept: "application/json",
        },
      },
    );
    const payload = (await response.json()) as NominatimResult[];

    return payload.map((entry) => ({
      address: entry.display_name,
      lat: Number(entry.lat),
      lng: Number(entry.lon),
    }));
  }
}

export function createGeocodingProvider(
  mode = process.env.NEXT_PUBLIC_GEO_PROVIDER ?? "stub",
) {
  if (mode === "nominatim") {
    return new NominatimGeocodingProvider();
  }

  return new StubGeocodingProvider();
}
