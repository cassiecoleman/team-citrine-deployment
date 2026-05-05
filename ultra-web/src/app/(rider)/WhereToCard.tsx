"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { createGeocodingProvider } from "@/features/maps/geocoding-provider";

export function WhereToCard() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = destination.trim();
    if (!query) {
      setError("Enter a destination address.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prefer live geocoding for free-form addresses.
      const liveGeocoder = createGeocodingProvider("nominatim");
      let results = await liveGeocoder.search(query);
      if (!results.length) {
        // Keep stub fallback for local/demo environments.
        const stubGeocoder = createGeocodingProvider("stub");
        results = await stubGeocoder.search(query);
      }
      const topResult = results[0];
      if (!topResult) {
        setError("Destination not recognized. Try a full Memphis address.");
        return;
      }

      const params = new URLSearchParams({
        to: "custom",
        address: topResult.address,
        lat: String(topResult.lat),
        lng: String(topResult.lng),
      });
      router.push(`/book?${params.toString()}`);
    } catch {
      setError("Unable to validate destination right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border px-4 py-3"
    >
      <label htmlFor="where-to-input" className="text-xs text-muted">
        Where to?
      </label>
      <div className="mt-2 flex items-center gap-2">
        <Search size={16} className="text-muted" />
        <input
          id="where-to-input"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          placeholder="Enter destination address"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          disabled={isSubmitting}
        />
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Checking address..." : "Continue to Booking"}
      </button>
    </form>
  );
}
