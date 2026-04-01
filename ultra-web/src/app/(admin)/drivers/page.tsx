"use client";

import { useMemo, useState } from "react";

interface Driver {
  id: string;
  name: string;
  status: string;
  rating: number;
  lastActive: string;
}

const drivers: Driver[] = [
  { id: "D-001", name: "Maria Lopez", status: "Active", rating: 4.9, lastActive: "5m ago" },
  { id: "D-002", name: "Jonah Reid", status: "Offline", rating: 4.7, lastActive: "42m ago" },
  { id: "D-003", name: "Preeti Sharma", status: "Active", rating: 4.8, lastActive: "2m ago" },
];

export default function AdminDrivers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesSearch = [driver.id, driver.name].some((value) => value.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "All" || driver.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div>
      <h1>All Drivers</h1>
      <p>US21: monitor and manage the full driver roster.</p>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by driver name or ID"
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "0.5rem" }}>
          <option>All</option>
          <option>Active</option>
          <option>Offline</option>
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "0.75rem" }}>Driver ID</th>
            <th style={{ padding: "0.75rem" }}>Name</th>
            <th style={{ padding: "0.75rem" }}>Status</th>
            <th style={{ padding: "0.75rem" }}>Rating</th>
            <th style={{ padding: "0.75rem" }}>Last Active</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((driver) => (
            <tr key={driver.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "0.75rem" }}>{driver.id}</td>
              <td style={{ padding: "0.75rem" }}>{driver.name}</td>
              <td style={{ padding: "0.75rem" }}>{driver.status}</td>
              <td style={{ padding: "0.75rem" }}>{driver.rating}</td>
              <td style={{ padding: "0.75rem" }}>{driver.lastActive}</td>
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
