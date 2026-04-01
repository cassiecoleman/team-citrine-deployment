"use client";

import { User, Star, ShieldCheck, Shield, Plus } from "lucide-react";
import type { TrustedDriver } from "../types";

export function TrustedDriversList({ drivers }: { drivers: TrustedDriver[] }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="font-semibold text-foreground">Trusted Drivers</h1>
      <p className="text-sm text-muted">
        Drivers approved for your children&apos;s rides
      </p>

      <div className="divide-y divide-border rounded-xl border border-border">
        {drivers.map((driver) => (
          <div key={driver.id} className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={20} className="text-muted" />
                <span className="font-semibold text-foreground">
                  {driver.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star size={14} className="text-primary" />
                <span className="text-sm text-foreground">{driver.rating}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary" />
              <span className="text-sm text-muted">
                {driver.totalRides} rides · Verified
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-primary" />
                <span className="text-sm text-muted">Background chk</span>
              </div>
              <button className="text-sm text-red-500">Remove</button>
            </div>
          </div>
        ))}
      </div>

      <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3">
        <Plus size={16} className="text-foreground" />
        <span className="font-semibold text-foreground">
          Add Trusted Driver
        </span>
      </button>

      <p className="text-xs text-muted">
        Trusted drivers must verify their identity with a PIN before starting a
        ride with your child.
      </p>
    </div>
  );
}
