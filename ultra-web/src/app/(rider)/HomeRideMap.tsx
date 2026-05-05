"use client";

import dynamic from "next/dynamic";
import { homeLocation, officeLocation } from "@/lib/mock-data";

const defaultHomeAddress = {
  lat: 35.1277,
  lng: -89.9765,
  address: "2145 Young Ave",
};

const RideMap = dynamic(
  () => import("@/features/maps/components/RideMap").then((mod) => mod.RideMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 w-full rounded-xl border border-border bg-primary-light" />
    ),
  },
);

export function HomeRideMap() {
  return (
    <div className="h-48">
      <RideMap
        pickup={homeLocation}
        dropoff={officeLocation}
        routeCoordinates={[homeLocation, defaultHomeAddress, officeLocation]}
        centerPoint={homeLocation}
        className="h-full w-full rounded-xl border border-border"
      />
    </div>
  );
}
