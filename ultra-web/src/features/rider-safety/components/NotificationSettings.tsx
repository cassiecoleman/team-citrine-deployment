"use client";

import { useState } from "react";
import { Phone, Pencil } from "lucide-react";
import type { NotificationPreferences } from "../types";

function Toggle({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`h-6 w-11 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-border"}`}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

export function NotificationSettings({
  preferences,
}: {
  preferences: NotificationPreferences;
}) {
  const [prefs, setPrefs] = useState({ ...preferences });

  function toggle(key: keyof NotificationPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="font-semibold text-foreground">SMS Alerts</h1>

      <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-muted" />
          <span className="text-sm text-foreground">{prefs.phone}</span>
        </div>
        <button className="flex items-center gap-1">
          <Pencil size={14} className="text-primary" />
          <span className="text-sm text-primary">Edit</span>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm text-foreground">Ride confirmed</span>
          <Toggle
            enabled={prefs.smsRideConfirmed}
            onToggle={() => toggle("smsRideConfirmed")}
            label="Ride confirmed"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm text-foreground">Driver arrives</span>
          <Toggle
            enabled={prefs.smsDriverArrives}
            onToggle={() => toggle("smsDriverArrives")}
            label="Driver arrives"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm text-foreground">Trip ends</span>
          <Toggle
            enabled={prefs.smsTripEnds}
            onToggle={() => toggle("smsTripEnds")}
            label="Trip ends"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm text-foreground">Trip cancelled</span>
          <Toggle
            enabled={prefs.smsTripCancelled}
            onToggle={() => toggle("smsTripCancelled")}
            label="Trip cancelled"
          />
        </div>
      </div>

      <hr className="border-border" />

      <h2 className="font-semibold text-foreground">In-App Notifications</h2>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm text-foreground">Push notifications</span>
          <Toggle
            enabled={prefs.pushNotifications}
            onToggle={() => toggle("pushNotifications")}
            label="Push notifications"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm text-foreground">Ride Pass reminders</span>
          <Toggle
            enabled={prefs.ridePassReminders}
            onToggle={() => toggle("ridePassReminders")}
            label="Ride Pass reminders"
          />
        </div>
      </div>
    </div>
  );
}
