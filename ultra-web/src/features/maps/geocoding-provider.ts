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

    if (normalized.includes("union ave")) {
      return [
        {
          address: "Union Ave, Memphis, TN, USA",
          lat: 35.1374,
          lng: -90.0342,
        },
      ];
    }

    if (normalized.includes("720 alumni ave")) {
      return [
        {
          address: "720 Alumni Ave, Memphis, TN 38152, USA",
          lat: 35.1201,
          lng: -89.9397,
        },
      ];
    }

    if (normalized.includes("2145 young ave")) {
      return [
        {
          address: "2145 Young Ave, Memphis, TN 38104, USA",
          lat: 35.1277,
          lng: -89.9765,
        },
      ];
    }

    if (normalized.includes("5050 poplar ave") || normalized.includes("i-bank tower")) {
      return [
        {
          address: "5050 Poplar Ave, Memphis, TN 38157, USA",
          lat: 35.1132,
          lng: -89.8929,
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
