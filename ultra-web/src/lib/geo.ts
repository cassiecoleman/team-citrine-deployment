const EARTH_RADIUS_MILES = 3958.8;

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineMiles(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): number {
  const latDelta = degreesToRadians(endLat - startLat);
  const lngDelta = degreesToRadians(endLng - startLng);
  const startLatRadians = degreesToRadians(startLat);
  const endLatRadians = degreesToRadians(endLat);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLatRadians) *
      Math.cos(endLatRadians) *
      Math.sin(lngDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

interface NominatimHit {
  lat: string;
  lon: string;
  display_name: string;
}

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "ultra-rideshare/0.1 (https://github.com/ai4sd-s26-memphis/team-citrine)";

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const url = `${NOMINATIM_ENDPOINT}?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) return null;

  const hits = (await response.json()) as NominatimHit[];
  const hit = hits[0];
  if (!hit) return null;

  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    displayName: hit.display_name,
  };
}
