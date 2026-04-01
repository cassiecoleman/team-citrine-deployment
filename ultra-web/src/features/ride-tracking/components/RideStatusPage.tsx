"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { RideDetail, DetailedRideStatus } from "../types";
import { MatchingScreen } from "./MatchingScreen";
import { DriverEnRouteCard } from "./DriverEnRouteCard";
import { DriverArrivedCard } from "./DriverArrivedCard";
import { InProgressTracker } from "./InProgressTracker";

const STATUS_SEQUENCE: DetailedRideStatus[] = [
  "matching",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
];

const STATUS_DURATIONS: Record<string, number> = {
  matching: 3000,
  en_route: 6000,
  arrived: 4000,
  in_progress: 8000,
};

function progressForStatus(status: DetailedRideStatus, ride: RideDetail): Partial<RideDetail> {
  switch (status) {
    case "en_route":
      return { etaMin: 5 };
    case "arrived":
      return { etaMin: 0 };
    case "in_progress":
      return { progressPercent: 60, distanceRemainingMi: 2.1, etaMin: 8 };
    default:
      return {};
  }
}

export function RideStatusPage({ ride: initialRide }: { ride: RideDetail }) {
  const router = useRouter();
  const [status, setStatus] = useState<DetailedRideStatus>(initialRide.status);
  const [ride, setRide] = useState(initialRide);

  const advanceStatus = useCallback(() => {
    const currentIndex = STATUS_SEQUENCE.indexOf(status);
    if (currentIndex < STATUS_SEQUENCE.length - 1) {
      const nextStatus = STATUS_SEQUENCE[currentIndex + 1];
      if (nextStatus === "completed") {
        router.push(`/ride/${ride.id}/complete`);
        return;
      }
      setStatus(nextStatus);
      setRide((prev) => ({ ...prev, status: nextStatus, ...progressForStatus(nextStatus, prev) }));
    }
  }, [status, ride.id, router]);

  useEffect(() => {
    const duration = STATUS_DURATIONS[status];
    if (!duration) return;
    const timer = setTimeout(advanceStatus, duration);
    return () => clearTimeout(timer);
  }, [status, advanceStatus]);

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
