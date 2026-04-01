"use client";

import { useState } from "react";
import { MapPin, Calendar, Clock, Repeat, User, ChevronDown } from "lucide-react";
import type { Location } from "@/types";
import type { RiderProfile } from "../types";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getMaxDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

interface ScheduleFormProps {
  pickup: Location;
  dropoff: Location;
  fare: number;
  profiles: RiderProfile[];
}

export function ScheduleForm({ pickup, dropoff, fare, profiles }: ScheduleFormProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [selectedProfile, setSelectedProfile] = useState("");
  const [endDate, setEndDate] = useState("");

  function toggleDay(day: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Pickup */}
      <div className="rounded-lg border border-border px-4 py-2.5 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-foreground">{pickup.address}</span>
        </div>
      </div>

      {/* Dropoff */}
      <div className="rounded-lg border border-border px-4 py-2.5 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted" />
          <span className="text-foreground">{dropoff.address}</span>
        </div>
      </div>

      {/* Date picker */}
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Calendar className="h-4 w-4" />
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={getTodayDate()}
          max={getMaxDate()}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Time picker */}
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Clock className="h-4 w-4" />
          Time
        </label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Recurring toggle */}
      <button
        type="button"
        onClick={() => setIsRecurring((prev) => !prev)}
        className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold ${
          isRecurring
            ? "border-primary bg-primary-light text-primary"
            : "border-border text-foreground"
        }`}
      >
        <Repeat className="h-4 w-4" />
        Recurring Ride
      </button>

      {/* Recurring options */}
      {isRecurring && (
        <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
          {/* Day-of-week selector */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-foreground">Repeat on</span>
            <div className="flex gap-2">
              {DAY_LABELS.map((label, index) => {
                const isSelected = selectedDays.has(index);
                return (
                  <button
                    key={index}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleDay(index)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      isSelected
                        ? "bg-primary text-white"
                        : "border border-border text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rider profile selector */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="h-4 w-4" />
              Rider Profile
            </label>
            <div className="relative">
              <select
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Select a rider</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} (Age {profile.age})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>
          </div>

          {/* End date picker */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calendar className="h-4 w-4" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={getTodayDate()}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      )}

      {/* Fare estimate */}
      <div className="rounded-xl border border-border p-4">
        <p className="text-sm text-foreground">
          Est. fare: <span className="font-semibold">${fare.toFixed(2)}/ride</span>
        </p>
      </div>

      {/* Confirm button */}
      <button
        type="button"
        className="w-full rounded-xl bg-primary py-4 text-white font-semibold"
      >
        Confirm Schedule
      </button>
    </div>
  );
}
