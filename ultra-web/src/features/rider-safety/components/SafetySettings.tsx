"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { EmergencyContact, TripSharingSettings } from "../types";

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

export function SafetySettings({
  contacts,
  sharing,
}: {
  contacts: EmergencyContact[];
  sharing: TripSharingSettings;
}) {
  const [contactStates, setContactStates] = useState(
    contacts.map((c) => ({ ...c })),
  );
  const [sharingState, setSharingState] = useState({ ...sharing });

  function toggleContactAutoShare(index: number) {
    setContactStates((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, autoShare: !c.autoShare } : c,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="font-semibold text-foreground">Emergency Contacts</h1>

      <div className="divide-y divide-border rounded-xl border border-border">
        {contactStates.map((contact, index) => (
          <div
            key={contact.id}
            className="flex items-center justify-between p-4"
          >
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">
                {contact.name}{" "}
                <span className="text-sm text-muted">
                  ({contact.relationship})
                </span>
              </span>
              <span className="text-sm text-muted">{contact.phone}</span>
            </div>
            <Toggle
              enabled={contact.autoShare}
              onToggle={() => toggleContactAutoShare(index)}
              label={`Auto-share with ${contact.name}`}
            />
          </div>
        ))}
      </div>

      <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3">
        <Plus size={16} className="text-foreground" />
        <span className="font-semibold text-foreground">
          Add Emergency Contact
        </span>
      </button>

      <hr className="border-border" />

      <h2 className="font-semibold text-foreground">Live Trip Sharing</h2>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm text-foreground">
            Auto-share all child rides
          </span>
          <Toggle
            enabled={sharingState.autoShareChildRides}
            onToggle={() =>
              setSharingState((s) => ({
                ...s,
                autoShareChildRides: !s.autoShareChildRides,
              }))
            }
            label="Auto-share all child rides"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm text-foreground">
            Include live map link
          </span>
          <Toggle
            enabled={sharingState.includeLiveMapLink}
            onToggle={() =>
              setSharingState((s) => ({
                ...s,
                includeLiveMapLink: !s.includeLiveMapLink,
              }))
            }
            label="Include live map link"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm text-foreground">Notify on arrival</span>
          <Toggle
            enabled={sharingState.notifyOnArrival}
            onToggle={() =>
              setSharingState((s) => ({
                ...s,
                notifyOnArrival: !s.notifyOnArrival,
              }))
            }
            label="Notify on arrival"
          />
        </div>
      </div>
    </div>
  );
}
