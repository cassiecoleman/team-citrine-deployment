"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { RideDetail, DetailedRideStatus } from "../types";
import { MatchingScreen } from "./MatchingScreen";
import { DriverEnRouteCard } from "./DriverEnRouteCard";
import { DriverArrivedCard } from "./DriverArrivedCard";
import { InProgressTracker } from "./InProgressTracker";
import { useRideStatus } from "../use-ride-status";

export function RideStatusPage({ ride: initialRide }: { ride: RideDetail }) {
  const router = useRouter();
  const { ride } = useRideStatus({
    rideId: initialRide.id,
    initialRide,
  });
  const status: DetailedRideStatus = ride.status;

  useEffect(() => {
    if (status === "completed") {
      router.push(`/ride/${ride.id}/complete`);
    }
  }, [status, ride.id, router]);

  switch (status) {
    case "matching":
      return <MatchingScreen ride={ride} />;
    case "en_route":
      return <DriverEnRouteCard ride={ride} />;
    case "arrived":
      return <DriverArrivedCard ride={ride} />;
    case "in_progress":
      return <InProgressTracker ride={ride} />;
    default:
      return null;
  }
}
