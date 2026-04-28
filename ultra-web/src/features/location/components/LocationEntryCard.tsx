"use client";

import { useState, type FormEvent } from "react";

import { submitMyLocation, type SubmitLocationState } from "../actions";

const initialState: SubmitLocationState = { success: false, error: null };

export function LocationEntryCard() {
  const [mode, setMode] = useState<"address" | "coords">("address");
  const [state, setState] = useState<SubmitLocationState>(initialState);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload =
      mode === "address"
        ? { address: String(data.get("address") ?? "") }
        : {
            lat: Number(data.get("lat")),
            lng: Number(data.get("lng")),
          };
    const next = await submitMyLocation(state, payload);
    setState(next);
    setIsPending(false);
  }

  return (
    <section className="rounded-xl border border-border bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-muted">Update your location</h2>

      <div className="mb-3 flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setMode("address")}
          className={`rounded-full px-3 py-1 ${mode === "address" ? "bg-primary text-white" : "bg-primary-light text-muted"}`}
        >
          Address
        </button>
        <button
          type="button"
          onClick={() => setMode("coords")}
          className={`rounded-full px-3 py-1 ${mode === "coords" ? "bg-primary text-white" : "bg-primary-light text-muted"}`}
        >
          Lat / Lng
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "address" ? (
          <div>
            <label htmlFor="address" className="block text-xs font-medium text-muted">
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              disabled={isPending}
              placeholder="1150 West End Ave, Memphis, TN"
              className="mt-1 w-full rounded border border-border px-3 py-2 text-sm"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="lat" className="block text-xs font-medium text-muted">
                Latitude
              </label>
              <input
                id="lat"
                name="lat"
                type="number"
                step="any"
                required
                disabled={isPending}
                className="mt-1 w-full rounded border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="lng" className="block text-xs font-medium text-muted">
                Longitude
              </label>
              <input
                id="lng"
                name="lng"
                type="number"
                step="any"
                required
                disabled={isPending}
                className="mt-1 w-full rounded border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {state.error ? (
          <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
        ) : null}

        {state.success && state.lat !== undefined && state.lng !== undefined ? (
          <p className="rounded bg-green-50 px-3 py-2 text-xs text-green-700">
            Saved {state.lat.toFixed(4)}, {state.lng.toFixed(4)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save Location"}
        </button>
      </form>
    </section>
  );
}
