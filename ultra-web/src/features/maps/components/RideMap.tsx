"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import { useMap } from "react-leaflet";
import type { RoutePoint } from "../routing-provider";
import "leaflet/dist/leaflet.css";

interface RideMapProps {
  pickup: RoutePoint & { address: string };
  dropoff: RoutePoint & { address: string };
  routeCoordinates?: RoutePoint[];
  driverLocation?: RoutePoint;
  centerPoint?: RoutePoint;
  className?: string;
}

function FitBoundsController({
  pickup,
  dropoff,
  routeCoordinates,
  driverLocation,
}: {
  pickup: RoutePoint;
  dropoff: RoutePoint;
  routeCoordinates?: RoutePoint[];
  driverLocation?: RoutePoint;
}) {
  const map = useMap();

  useEffect(() => {
    const points =
      routeCoordinates && routeCoordinates.length > 1
        ? routeCoordinates
        : [pickup, dropoff, ...(driverLocation ? [driverLocation] : [])];

    if (points.length < 2) {
      map.setView([pickup.lat, pickup.lng], 13);
      return;
    }

    const bounds = points.map((point) => [point.lat, point.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }, [driverLocation, dropoff, map, pickup, routeCoordinates]);

  return null;
}

export function RideMap({
  pickup,
  dropoff,
  routeCoordinates,
  driverLocation,
  centerPoint,
  className,
}: RideMapProps) {
  const center: [number, number] = [
    (centerPoint?.lat ?? (pickup.lat + dropoff.lat) / 2),
    (centerPoint?.lng ?? (pickup.lng + dropoff.lng) / 2),
  ];

  return (
    <div className={className} data-testid="ride-map">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full rounded-xl"
      >
        <FitBoundsController
          pickup={pickup}
          dropoff={dropoff}
          routeCoordinates={routeCoordinates}
          driverLocation={driverLocation}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CircleMarker center={[pickup.lat, pickup.lng]} radius={8} pathOptions={{ color: "#16a34a" }}>
          <Popup>{pickup.address}</Popup>
        </CircleMarker>

        <CircleMarker center={[dropoff.lat, dropoff.lng]} radius={8} pathOptions={{ color: "#2563eb" }}>
          <Popup>{dropoff.address}</Popup>
        </CircleMarker>

        {driverLocation ? (
          <CircleMarker
            center={[driverLocation.lat, driverLocation.lng]}
            radius={7}
            pathOptions={{ color: "#f97316" }}
          >
            <Popup>Driver location</Popup>
          </CircleMarker>
        ) : null}

        {routeCoordinates && routeCoordinates.length > 1 ? (
          <Polyline
            positions={routeCoordinates.map((point) => [point.lat, point.lng] as [number, number])}
            pathOptions={{ color: "#2563eb", weight: 4 }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
