import { NextResponse } from "next/server";
import { StubGeocodingProvider } from "@/features/maps/geocoding-provider";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
  };
}

const MEMPHIS_CENTER = { lat: 35.1495, lng: -90.049 };

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

function normalizeText(input?: string): string {
  return (input ?? "").toLowerCase();
}

function buildDisplayAddress(entry: NominatimResult): string {
  const houseNumber = entry.address?.house_number?.trim();
  const road = entry.address?.road?.trim();
  if (houseNumber && road) {
    return `${houseNumber} ${road}`;
  }
  if (road) {
    return road;
  }
  const parts = entry.display_name
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const first = parts[0] ?? "";
  const second = parts[1] ?? "";
  if (/^\d+[a-zA-Z-]?$/.test(first) && second) {
    return `${first} ${second}`;
  }
  return first || entry.display_name;
}

function scoreResult(
  entry: NominatimResult,
  lat: number,
  lng: number,
  fromLat: number | null,
  fromLng: number | null,
): number {
  const cityLike = normalizeText(
    entry.address?.city ?? entry.address?.town ?? entry.address?.village,
  );
  const county = normalizeText(entry.address?.county);
  const state = normalizeText(entry.address?.state);
  const display = normalizeText(entry.display_name);

  let score = 0;

  if (cityLike.includes("memphis") || display.includes("memphis")) score += 50;
  if (county.includes("shelby")) score += 15;
  if (state.includes("tennessee")) score += 10;

  const anchorLat = fromLat ?? MEMPHIS_CENTER.lat;
  const anchorLng = fromLng ?? MEMPHIS_CENTER.lng;
  const distanceMiles = haversineMiles(anchorLat, anchorLng, lat, lng);
  score += Math.max(0, 40 - distanceMiles * 2);

  return score;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const fromLatRaw = Number(url.searchParams.get("fromLat"));
  const fromLngRaw = Number(url.searchParams.get("fromLng"));
  const fromLat = Number.isFinite(fromLatRaw) ? fromLatRaw : null;
  const fromLng = Number.isFinite(fromLngRaw) ? fromLngRaw : null;

  if (!q) {
    return NextResponse.json({ error: "Query is required." }, { status: 400 });
  }

  try {
    const encoded = encodeURIComponent(q);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encoded}`,
      {
        headers: {
          accept: "application/json",
          "user-agent": "team-citrine-ultra-web/1.0",
        },
        cache: "no-store",
      },
    );

    if (response.ok) {
      const payload = (await response.json()) as NominatimResult[];
      const results = payload
        .map((entry) => {
          const lat = Number(entry.lat);
          const lng = Number(entry.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null;
          }
          return {
            address: buildDisplayAddress(entry),
            canonicalAddress: entry.display_name,
            lat,
            lng,
            score: scoreResult(entry, lat, lng, fromLat, fromLng),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .sort((a, b) => b.score - a.score)
        .map(({ score, ...entry }) => entry);
      return NextResponse.json({ results });
    }
  } catch {
    // fall through to stub fallback
  }

  const stub = new StubGeocodingProvider();
  const results = await stub.search(q);
  return NextResponse.json({ results });
}
