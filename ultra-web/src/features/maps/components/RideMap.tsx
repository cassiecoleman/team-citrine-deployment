"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import type { RoutePoint } from "../routing-provider";
import "leaflet/dist/leaflet.css";

interface RideMapProps {
  pickup: RoutePoint & { address: string };
  dropoff: RoutePoint & { address: string };
  routeCoordinates?: RoutePoint[];
  driverLocation?: RoutePoint;
  className?: string;
}

export function RideMap({
  pickup,
  dropoff,
  routeCoordinates,
  driverLocation,
  className,
}: RideMapProps) {
  const center: [number, number] = [
    (pickup.lat + dropoff.lat) / 2,
    (pickup.lng + dropoff.lng) / 2,
  ];

  return (
    <div className={className} data-testid="ride-map">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full rounded-xl"
      >
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
