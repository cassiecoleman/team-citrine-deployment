"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f9" }}>
      <aside
        style={{
          width: 280,
          background: "#0f172a",
          color: "#ffffff",
          padding: "2rem 1rem",
          borderRight: "1px solid #273449",
        }}
      >
        <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem" }}>Ultra Admin</h1>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Link style={{ color: "#a5b4fc", textDecoration: "none" }} href="/drivers">
            Drivers
          </Link>
          <Link style={{ color: "#a5b4fc", textDecoration: "none" }} href="/requests">
            Active Requests
          </Link>
          <Link style={{ color: "#a5b4fc", textDecoration: "none" }} href="/rides">
            Active Rides
          </Link>
          <Link style={{ color: "#a5b4fc", textDecoration: "none" }} href="/completed">
            Completed Rides
          </Link>
        </nav>
      </aside>

      <main style={{ flexGrow: 1, padding: "2rem" }}>
        {children}
      </main>
    </div>
  );
}
