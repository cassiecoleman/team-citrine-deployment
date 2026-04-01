"use client";

import { useMemo, useState } from "react";

interface RequestRow {
  id: string;
  pickup: string;
  dropoff: string;
  requestedAt: string;
  zone: string;
}

const requests: RequestRow[] = [
  { id: "R-4401", pickup: "1401 Taylor St", dropoff: "Ward High", requestedAt: "08:03", zone: "West" },
  { id: "R-4410", pickup: "2000 Lake Ave", dropoff: "Downtown Plaza", requestedAt: "08:08", zone: "Central" },
];

export default function AdminRequests() {
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("All");

  const filtered = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch = [req.id, req.pickup, req.dropoff].some((value) => value.toLowerCase().includes(search.toLowerCase()));
      const matchesZone = zoneFilter === "All" || req.zone === zoneFilter;
      return matchesSearch && matchesZone;
    });
  }, [search, zoneFilter]);

  return (
    <div>
      <h1>Active Unfilled Requests</h1>
      <p>US22: track pending rides that need driver assignment.</p>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by request ID, pickup, or dropoff"
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} style={{ padding: "0.5rem" }}>
          <option>All</option>
          <option>West</option>
          <option>Central</option>
          <option>East</option>
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "0.75rem" }}>Request ID</th>
            <th style={{ padding: "0.75rem" }}>Pickup</th>
            <th style={{ padding: "0.75rem" }}>Dropoff</th>
            <th style={{ padding: "0.75rem" }}>Requested At</th>
            <th style={{ padding: "0.75rem" }}>Zone</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((req) => (
            <tr key={req.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "0.75rem" }}>{req.id}</td>
              <td style={{ padding: "0.75rem" }}>{req.pickup}</td>
              <td style={{ padding: "0.75rem" }}>{req.dropoff}</td>
              <td style={{ padding: "0.75rem" }}>{req.requestedAt}</td>
              <td style={{ padding: "0.75rem" }}>{req.zone}</td>
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
