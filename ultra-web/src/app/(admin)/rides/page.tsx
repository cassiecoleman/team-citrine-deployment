"use client";

import { useMemo, useState } from "react";

interface RideRow {
  id: string;
  rider: string;
  driver: string;
  status: string;
  eta: string;
}

const rides: RideRow[] = [
  { id: "T-9201", rider: "June Park", driver: "Maria Lopez", status: "En Route", eta: "7m" },
  { id: "T-9205", rider: "Carlos Vega", driver: "Preeti Sharma", status: "In Progress", eta: "12m" },
];

export default function AdminRides() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    return rides.filter((ride) => {
      const matchesSearch = [ride.id, ride.rider, ride.driver].some((value) => value.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "All" || ride.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div>
      <h1>Active In-Progress Rides</h1>
      <p>US23: visualize active rides and dispatch status in real time.</p>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ride ID, rider, or driver"
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "0.5rem" }}>
          <option>All</option>
          <option>En Route</option>
          <option>In Progress</option>
          <option>Assigned</option>
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "0.75rem" }}>Ride ID</th>
            <th style={{ padding: "0.75rem" }}>Rider</th>
            <th style={{ padding: "0.75rem" }}>Driver</th>
            <th style={{ padding: "0.75rem" }}>Status</th>
            <th style={{ padding: "0.75rem" }}>ETA</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((ride) => (
            <tr key={ride.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "0.75rem" }}>{ride.id}</td>
              <td style={{ padding: "0.75rem" }}>{ride.rider}</td>
              <td style={{ padding: "0.75rem" }}>{ride.driver}</td>
              <td style={{ padding: "0.75rem" }}>{ride.status}</td>
              <td style={{ padding: "0.75rem" }}>{ride.eta}</td>
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
