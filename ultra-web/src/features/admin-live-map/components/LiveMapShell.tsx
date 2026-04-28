"use client";

import dynamic from "next/dynamic";

import type { LiveLocationsResult } from "@/features/location/actions";

const LiveMapClient = dynamic(
  () => import("./LiveMapClient").then((mod) => mod.LiveMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full rounded-xl border border-border bg-primary-light" />
    ),
  },
);

export function LiveMapShell({
  initialLocations,
}: {
  initialLocations: LiveLocationsResult;
}) {
  return <LiveMapClient initialLocations={initialLocations} />;
}
