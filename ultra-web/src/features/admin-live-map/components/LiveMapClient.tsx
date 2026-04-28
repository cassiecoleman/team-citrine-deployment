"use client";

import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { LiveLocationsResult } from "@/features/location/actions";
import { haversineMiles } from "@/lib/geo";
import { createClient } from "@/lib/supabase";

const RIDER_COLOR = "#2563eb"; // blue
const DRIVER_COLOR = "#f97316"; // orange
const MEMPHIS_CENTER: [number, number] = [35.135, -90.045];

type RiderMarker = LiveLocationsResult["riders"][number];
type DriverMarker = LiveLocationsResult["drivers"][number];

interface LiveMapClientProps {
  initialLocations: LiveLocationsResult;
}

export function LiveMapClient({ initialLocations }: LiveMapClientProps) {
  const [riders, setRiders] = useState<RiderMarker[]>(initialLocations.riders);
  const [drivers, setDrivers] = useState<DriverMarker[]>(initialLocations.drivers);

  useEffect(() => {
    const supabase = createClient();

    // Initial load — the SSR pass may not have a session cookie in some
    // demo flows (programmatic cookie injection lands after the first
    // render). Fetching here guarantees dots appear once the admin
    // browser is authed, regardless of when seeding happened.
    void Promise.all([
      supabase
        .from("riders")
        .select("id, name, current_lat, current_lng, current_location_updated_at")
        .not("current_lat", "is", null)
        .not("current_lng", "is", null),
      supabase
        .from("driver_locations")
        .select("driver_id, lat, lng, recorded_at, drivers!inner(id, name, status)"),
    ]).then(([riderResp, driverResp]) => {
      if (riderResp.data) {
        setRiders(
          riderResp.data.map((row) => ({
            id: String(row.id),
            name: String(row.name ?? ""),
            lat: Number(row.current_lat),
            lng: Number(row.current_lng),
            updatedAt: (row.current_location_updated_at as string | null) ?? null,
          })),
        );
      }
      if (driverResp.data) {
        setDrivers(
          driverResp.data.map((row) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const drv = (Array.isArray((row as any).drivers)
              ? (row as any).drivers[0]
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              : (row as any).drivers) as { id?: string; name?: string; status?: string } | undefined;
            return {
              id: drv?.id ?? String(row.driver_id),
              name: drv?.name ?? "",
              status: drv?.status ?? "",
              lat: Number(row.lat),
              lng: Number(row.lng),
              updatedAt: (row.recorded_at as string | null) ?? null,
            };
          }),
        );
      }
    });

    const channel = supabase
      .channel("admin-live-map")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "*", schema: "public" },
        (payload: {
          eventType?: string;
          table?: string;
          new?: Record<string, unknown> | null;
        }) => {
          const row = payload.new;
          if (!row) return;
          if (payload.table === "riders") {
            const lat = row.current_lat;
            const lng = row.current_lng;
            if (lat == null || lng == null) return;
            setRiders((prev) =>
              upsertById(prev, {
                id: String(row.id),
                name: String(row.name ?? ""),
                lat: Number(lat),
                lng: Number(lng),
                updatedAt:
                  (row.current_location_updated_at as string | null) ?? null,
              }),
            );
          } else if (payload.table === "driver_locations") {
            const driverId = String(row.driver_id ?? "");
            if (!driverId) return;
            setDrivers((prev) =>
              prev.map((d) =>
                d.id === driverId
                  ? {
                      ...d,
                      lat: Number(row.lat),
                      lng: Number(row.lng),
                      updatedAt: (row.recorded_at as string | null) ?? d.updatedAt,
                    }
                  : d,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const matchLines = riders
    .map((rider) => {
      const nearest = nearestAvailableDriver(rider, drivers);
      if (!nearest) return null;
      return {
        riderId: rider.id,
        driverId: nearest.driver.id,
        distance: nearest.distance,
        positions: [
          [rider.lat, rider.lng] as [number, number],
          [nearest.driver.lat, nearest.driver.lng] as [number, number],
        ],
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <div className="h-[600px] w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={MEMPHIS_CENTER}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {drivers.map((driver) => (
          <CircleMarker
            key={`driver-${driver.id}`}
            center={[driver.lat, driver.lng]}
            radius={9}
            pathOptions={{ color: DRIVER_COLOR, fillColor: DRIVER_COLOR, fillOpacity: 0.7 }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">{driver.name}</p>
                <p className="text-muted">{driver.status}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {riders.map((rider) => (
          <CircleMarker
            key={`rider-${rider.id}`}
            center={[rider.lat, rider.lng]}
            radius={7}
            pathOptions={{ color: RIDER_COLOR, fillColor: RIDER_COLOR, fillOpacity: 0.7 }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">{rider.name}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {matchLines.map((line) => (
          <Polyline
            key={`match-${line.riderId}-${line.driverId}`}
            positions={line.positions}
            pathOptions={{
              color: "#9ca3af",
              weight: 2,
              dashArray: "4 6",
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}

function upsertById<T extends { id: string }>(list: T[], next: T): T[] {
  const idx = list.findIndex((item) => item.id === next.id);
  if (idx === -1) return [...list, next];
  const copy = list.slice();
  copy[idx] = next;
  return copy;
}

function nearestAvailableDriver(
  rider: RiderMarker,
  drivers: DriverMarker[],
): { driver: DriverMarker; distance: number } | null {
  const candidates = drivers.filter((d) => d.status === "available");
  if (candidates.length === 0) return null;
  let best = { driver: candidates[0]!, distance: Number.POSITIVE_INFINITY };
  for (const driver of candidates) {
    const distance = haversineMiles(rider.lat, rider.lng, driver.lat, driver.lng);
    if (distance < best.distance) best = { driver, distance };
  }
  return best;
}
