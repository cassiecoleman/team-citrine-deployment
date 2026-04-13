"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MapPin, CreditCard, Users, Calendar } from "lucide-react";
import type { FareEstimate } from "@/features/fare-split/types";
import { createGeocodingProvider } from "@/features/maps/geocoding-provider";
import { createRoutingProvider } from "@/features/maps/routing-provider";
import { formatCurrency } from "@/lib/utils";
import type { Location } from "@/types";

const RideMap = dynamic(
  () => import("@/features/maps/components/RideMap").then((mod) => mod.RideMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full rounded-xl border border-border bg-primary-light" />,
  },
);

interface BookingClientProps {
  estimate: FareEstimate;
  pickup: Location;
  initialDropoff: Location;
  requestRideAction: (formData: FormData) => void | Promise<void>;
}

export function BookingClient({
  estimate,
  pickup,
  initialDropoff,
  requestRideAction,
}: BookingClientProps) {
  const [destinationQuery, setDestinationQuery] = useState("");
  const [dropoff, setDropoff] = useState(initialDropoff);
  const [distanceMi, setDistanceMi] = useState(estimate.distanceMi);
  const [etaMin, setEtaMin] = useState(estimate.durationMin);
  const [routeCoordinates, setRouteCoordinates] = useState<
    Array<{ lat: number; lng: number }> | undefined
  >(undefined);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleDestinationSearch() {
    const geocoder = createGeocodingProvider();
    const router = createRoutingProvider();
    const results = await geocoder.search(destinationQuery);
    const topResult = results[0];

    if (!topResult) {
      setSearchError("No destination match found. Try a Memphis address.");
      return;
    }

    setDropoff({
      address: topResult.address,
      lat: topResult.lat,
      lng: topResult.lng,
    });
    setSearchError(null);

    const route = await router.getRoute(
      { lat: pickup.lat, lng: pickup.lng },
      { lat: topResult.lat, lng: topResult.lng },
    );

    setRouteCoordinates(route.coordinates);
    setDistanceMi(route.distanceMiles);

    const etaFromMatrix = await router.getEtaMinutes(
      { lat: pickup.lat, lng: pickup.lng },
      { lat: topResult.lat, lng: topResult.lng },
    );
    setEtaMin(etaFromMatrix || route.durationMinutes);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="h-40">
        <RideMap
          pickup={pickup}
          dropoff={dropoff}
          routeCoordinates={routeCoordinates}
          className="h-full w-full rounded-xl border border-border"
        />
      </div>

      {/* From / To */}
      <div className="space-y-2">
        <label className="text-xs text-muted">From:</label>
        <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm">
          <MapPin size={16} className="text-success" />
          {pickup.address}
        </div>
        <label className="text-xs text-muted" htmlFor="destination-search">
          Destination
        </label>
        <div className="flex gap-2">
          <input
            id="destination-search"
            value={destinationQuery}
            onChange={(event) => setDestinationQuery(event.target.value)}
            placeholder="Search destination"
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleDestinationSearch}
            className="rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary"
          >
            Find destination
          </button>
        </div>
        {searchError ? <p className="text-xs text-destructive">{searchError}</p> : null}
        <label className="text-xs text-muted">To:</label>
        <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm">
          <MapPin size={16} className="text-primary" />
          {dropoff.address}
        </div>
      </div>

      {/* Fare estimate */}
      <div className="rounded-xl border border-border px-4 py-3">
        <p className="text-xs text-muted mb-1">Ride Estimate</p>
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-muted" />
          <span className="text-lg font-bold">{formatCurrency(estimate.totalFare)}</span>
          <span className="text-sm text-muted">solo</span>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted">
          <span>{distanceMi} mi</span>
          <span>~{etaMin} min</span>
        </div>
      </div>

      {/* Split Fare button */}
      <Link
        href="/book/split"
        className="flex items-center justify-between rounded-xl border-2 border-primary bg-primary-light px-4 py-4"
      >
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <div>
            <p className="font-semibold text-sm">Split Fare</p>
            <p className="text-xs text-muted">Save up to 50%</p>
          </div>
        </div>
        <span className="text-primary font-semibold text-sm">
          {formatCurrency(estimate.totalFare / 2)} each
        </span>
      </Link>

      {/* Schedule button */}
      <Link
        href="/book/schedule"
        className="flex items-center gap-2 rounded-xl border border-border px-4 py-3"
      >
        <Calendar size={16} className="text-muted" />
        <div>
          <p className="font-semibold text-sm">Schedule</p>
          <p className="text-xs text-muted">Book for later</p>
        </div>
      </Link>

      {/* Request Ride CTA */}
      <form action={requestRideAction}>
        <input type="hidden" name="pickupLat" value={pickup.lat} />
        <input type="hidden" name="pickupLng" value={pickup.lng} />
        <input type="hidden" name="pickupAddress" value={pickup.address} />
        <input type="hidden" name="dropoffLat" value={dropoff.lat} />
        <input type="hidden" name="dropoffLng" value={dropoff.lng} />
        <input type="hidden" name="dropoffAddress" value={dropoff.address} />
        <button
          type="submit"
          className="w-full rounded-xl bg-primary py-4 text-center text-white font-semibold"
        >
          Request Ride {formatCurrency(estimate.totalFare)}
        </button>
      </form>
    </div>
  );
}
