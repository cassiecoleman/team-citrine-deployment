"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import type { RideDetail } from "../types";
import { formatCurrency } from "@/lib/utils";

export function MatchingScreen({ ride }: { ride: RideDetail }) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancelRequest() {
    setIsCancelling(true);
    setError(null);
    try {
      const response = await fetch(`/api/rides/${ride.id}/cancel`, {
        method: "POST",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? "Unable to cancel ride right now.");
        return;
      }
      router.push("/");
    } catch {
      setError("Unable to cancel ride right now.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="animate-pulse rounded-full bg-primary-light p-6">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
        <p className="font-semibold text-lg">Finding your driver...</p>
      </div>

      <div className="rounded-xl border border-border p-4">
        <div className="flex items-start gap-3">
          <MapPin className="text-primary mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-xs text-muted">Pickup</p>
            <p className="text-sm font-semibold">{ride.pickup.address}</p>
          </div>
        </div>
        <div className="ml-2.5 h-6 border-l border-dashed border-border" />
        <div className="flex items-start gap-3">
          <MapPin className="text-muted mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-xs text-muted">Destination</p>
            <p className="text-sm font-semibold">{ride.dropoff.address}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <p className="text-sm text-muted">Estimated Fare</p>
          <p className="font-bold">{formatCurrency(ride.estimatedFare)}</p>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        onClick={handleCancelRequest}
        disabled={isCancelling}
        className="rounded-xl border border-border px-4 py-3 text-sm font-semibold disabled:opacity-60"
      >
        {isCancelling ? "Cancelling..." : "Cancel Request"}
      </button>
    </div>
  );
}
