import { NextResponse } from "next/server";
import { StubGeocodingProvider } from "@/features/maps/geocoding-provider";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();

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
      const results = payload.map((entry) => ({
        address: entry.display_name,
        lat: Number(entry.lat),
        lng: Number(entry.lon),
      }));
      return NextResponse.json({ results });
    }
  } catch {
    // fall through to stub fallback
  }

  const stub = new StubGeocodingProvider();
  const results = await stub.search(q);
  return NextResponse.json({ results });
}
