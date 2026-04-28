import Link from "next/link";

import { LocationEntryCard } from "@/features/location/components/LocationEntryCard";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Map placeholder */}
      <div className="rounded-xl bg-primary-light border border-border h-48 flex items-center justify-center">
        <div className="text-center text-sm text-muted">
          <p className="text-3xl mb-2">{"\uD83D\uDCCD"}</p>
          <p>Map View</p>
          <p className="text-xs">You are here</p>
        </div>
      </div>

      <LocationEntryCard />

      {/* Ride Pass banner */}
      <Link
        href="/passes"
        className="flex items-center justify-between rounded-xl bg-primary p-4 text-white"
      >
        <div>
          <p className="font-semibold">{"\uD83C\uDFAB"} Ride Pass</p>
          <p className="text-sm opacity-90">Save up to 25% on your commute</p>
        </div>
        <span className="text-lg">{"\u279C"}</span>
      </Link>

      {/* Where to? */}
      <Link
        href="/book"
        className="rounded-xl border border-border px-4 py-3 text-muted text-sm"
      >
        {"\uD83D\uDD0D"} Where to?
      </Link>

      {/* Saved locations */}
      <div className="space-y-2">
        <Link
          href="/book"
          className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
        >
          <span>{"\uD83C\uDFE0"}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">Home</p>
            <p className="text-xs text-muted">742 Elm St</p>
          </div>
          <span className="text-muted">{"\u2B50"}</span>
        </Link>
        <Link
          href="/book"
          className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
        >
          <span>{"\uD83C\uDFE2"}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">Office</p>
            <p className="text-xs text-muted">Downtown Office</p>
          </div>
          <span className="text-muted">{"\u2B50"}</span>
        </Link>
      </div>
    </div>
  );
}
