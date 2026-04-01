"use client";

import { useMemo, useState } from "react";

interface CompletedRide {
  id: string;
  rider: string;
  driver: string;
  fare: string;
  completedAt: string;
}

const completed: CompletedRide[] = [
  { id: "C-7801", rider: "Maya Brooks", driver: "Jonah Reid", fare: "$13.30", completedAt: "09:30" },
  { id: "C-7802", rider: "Derek Yuan", driver: "Maria Lopez", fare: "$18.75", completedAt: "09:34" },
];

export default function AdminCompleted() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Today");

  const filtered = useMemo(() => {
    return completed.filter((ride) => {
      const matchesSearch = [ride.id, ride.rider, ride.driver].some((value) => value.toLowerCase().includes(search.toLowerCase()));
      const matchesDate = dateFilter === "Today" || dateFilter === "Yesterday" || dateFilter === "Last 7 Days";
      return matchesSearch && matchesDate;
    });
  }, [search, dateFilter]);

  return (
    <div>
      <h1>Completed Rides</h1>
      <p>US24: historical ride data with search and filter support (US25).</p>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ride ID, rider, or driver"
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ padding: "0.5rem" }}>
          <option>Today</option>
          <option>Yesterday</option>
          <option>Last 7 Days</option>
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "0.75rem" }}>Ride ID</th>
            <th style={{ padding: "0.75rem" }}>Rider</th>
            <th style={{ padding: "0.75rem" }}>Driver</th>
            <th style={{ padding: "0.75rem" }}>Fare</th>
            <th style={{ padding: "0.75rem" }}>Completed At</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((ride) => (
            <tr key={ride.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "0.75rem" }}>{ride.id}</td>
              <td style={{ padding: "0.75rem" }}>{ride.rider}</td>
              <td style={{ padding: "0.75rem" }}>{ride.driver}</td>
              <td style={{ padding: "0.75rem" }}>{ride.fare}</td>
              <td style={{ padding: "0.75rem" }}>{ride.completedAt}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "1rem", textAlign: "center" }}>
                No results match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
