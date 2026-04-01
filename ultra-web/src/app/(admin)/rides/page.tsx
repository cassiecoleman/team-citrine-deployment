"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageShell from "@/features/admin-dashboard/components/AdminPageShell";
import AdminFilterBar from "@/features/admin-dashboard/components/AdminFilterBar";
import AdminDataTable from "@/features/admin-dashboard/components/AdminDataTable";
import { fetchRides } from "@/features/admin-dashboard/actions";
import type { AdminRide } from "@/features/admin-dashboard/types";

export default function AdminRides() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [rides, setRides] = useState<AdminRide[]>([]);

  useEffect(() => {
    void fetchRides().then(setRides);
  }, []);

  const visibleRides = useMemo(() => {
    const searchLower = search.toLowerCase();
    return rides.filter((ride) => {
      const matchesSearch =
        ride.rideId.toLowerCase().includes(searchLower) ||
        ride.riderName.toLowerCase().includes(searchLower) ||
        ride.driverName.toLowerCase().includes(searchLower);
      const matchesStatus = status === "All" || ride.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [rides, search, status]);

  const rows = visibleRides.map((ride) => ({
    rideId: ride.rideId,
    rider: ride.riderName,
    driver: ride.driverName,
    origin: ride.origin,
    status: ride.status,
  }));

  return (
    <AdminPageShell title="Active Rides" description="US23: track ongoing rides in real-time">
      <AdminFilterBar
        search={search}
        onSearch={setSearch}
        filter={{
          label: "Ride Status",
          value: status,
          options: [
            { value: "All", label: "All" },
            { value: "In Progress", label: "In Progress" },
            { value: "Picked Up", label: "Picked Up" },
            { value: "Dropped Off", label: "Dropped Off" },
          ],
          onChange: setStatus,
        }}
      />
      <AdminDataTable
        columns={[
          { header: "Ride ID", accessor: "rideId" },
          { header: "Rider", accessor: "rider" },
          { header: "Driver", accessor: "driver" },
          { header: "Origin", accessor: "origin" },
          { header: "Status", accessor: "status" },
        ]}
        data={rows}
        noDataMessage="No active rides match your filters."
      />
    </AdminPageShell>
  );
}
