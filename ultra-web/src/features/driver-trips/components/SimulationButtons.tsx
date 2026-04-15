"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SimulationButtonsProps {
  rideId: string;
  rideStatus: string;
  arriveAction: () => Promise<{ success: boolean; error?: string }>;
  completeAction: () => Promise<{ success: boolean; error?: string }>;
}

export function SimulationButtons({
  rideId,
  rideStatus,
  arriveAction,
  completeAction,
}: SimulationButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArrive() {
    setLoading(true);
    setError(null);
    const result = await arriveAction();
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Failed to simulate arrival");
    }
    setLoading(false);
  }

  async function handleComplete() {
    setLoading(true);
    setError(null);
    const result = await completeAction();
    if (result.success) {
      router.push("/queue");
    } else {
      setError(result.error ?? "Failed to complete trip");
    }
    setLoading(false);
  }

  return (
    <div className="border-t border-border mt-4 pt-4 space-y-3">
      <p className="text-xs text-muted font-medium uppercase tracking-wide">Demo Controls</p>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded p-2">{error}</p>
      )}
      {rideStatus === "driver_en_route" && (
        <button
          onClick={handleArrive}
          disabled={loading}
          className="w-full rounded-lg bg-amber-500 py-3 text-white font-semibold text-sm disabled:opacity-50"
        >
          {loading ? "Simulating..." : "⏩ Simulate Drive to Rider"}
        </button>
      )}
      {(rideStatus === "arrived" || rideStatus === "in_progress") && (
        <button
          onClick={handleComplete}
          disabled={loading}
          className="w-full rounded-lg bg-green-600 py-3 text-white font-semibold text-sm disabled:opacity-50"
        >
          {loading ? "Completing..." : "⏩ Simulate Trip Completion"}
        </button>
      )}
    </div>
  );
}
