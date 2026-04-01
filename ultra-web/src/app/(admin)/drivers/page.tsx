"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageShell from "@/features/admin-dashboard/components/AdminPageShell";
import AdminFilterBar from "@/features/admin-dashboard/components/AdminFilterBar";
import AdminDataTable from "@/features/admin-dashboard/components/AdminDataTable";
import { fetchDrivers } from "@/features/admin-dashboard/actions";
import type { AdminDriver } from "@/features/admin-dashboard/types";

export default function AdminDrivers() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);

  useEffect(() => {
    void fetchDrivers().then(setDrivers);
  }, []);

  const visibleDrivers = useMemo(() => {
    const searchLower = search.toLowerCase();

    return drivers.filter((driver) => {
      const matchesSearch =
        driver.id.toLowerCase().includes(searchLower) ||
        driver.name.toLowerCase().includes(searchLower);
      const matchesStatus = status === "All" || driver.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [drivers, search, status]);

  const rows = visibleDrivers.map((driver) => ({
    driverId: driver.id,
    name: driver.name,
    status: driver.status,
    rating: driver.rating,
    lastActive: driver.lastActive,
  }));

  return (
    <AdminPageShell title="All Drivers" description="US21: monitor and manage the full driver roster.">
      <AdminFilterBar
        search={search}
        onSearch={setSearch}
        filter={{
          label: "Driver Status",
          value: status,
          options: [
            { value: "All", label: "All" },
            { value: "Active", label: "Active" },
            { value: "Offline", label: "Offline" },
          ],
          onChange: setStatus,
        }}
      />
      <AdminDataTable
        columns={[
          { header: "Driver ID", accessor: "driverId" },
          { header: "Name", accessor: "name" },
          { header: "Status", accessor: "status" },
          { header: "Rating", accessor: "rating" },
          { header: "Last Active", accessor: "lastActive" },
        ]}
        data={rows}
        noDataMessage="No drivers match the search and filters."
      />
    </AdminPageShell>
  );
}
