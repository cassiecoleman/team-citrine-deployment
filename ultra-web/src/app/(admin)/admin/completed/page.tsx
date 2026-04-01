"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageShell from "@/features/admin-dashboard/components/AdminPageShell";
import AdminFilterBar from "@/features/admin-dashboard/components/AdminFilterBar";
import AdminDataTable from "@/features/admin-dashboard/components/AdminDataTable";
import { fetchCompletedRides } from "@/features/admin-dashboard/actions";
import type { AdminCompletedRide } from "@/features/admin-dashboard/types";

export default function AdminCompletedRides() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [rides, setRides] = useState<AdminCompletedRide[]>([]);

  useEffect(() => {
    void fetchCompletedRides().then(setRides);
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
    distance: ride.distance,
    status: ride.status,
  }));

  return (
    <AdminPageShell title="Completed Rides" description="US24: analyze completed ride history and trends.">
      <AdminFilterBar
        search={search}
        onSearch={setSearch}
        filter={{
          label: "Completion Status",
          value: status,
          options: [
            { value: "All", label: "All" },
            { value: "Completed", label: "Completed" },
            { value: "Cancelled", label: "Cancelled" },
          ],
          onChange: setStatus,
        }}
      />
      <AdminDataTable
        columns={[
          { header: "Ride ID", accessor: "rideId" },
          { header: "Rider", accessor: "rider" },
          { header: "Driver", accessor: "driver" },
          { header: "Distance", accessor: "distance" },
          { header: "Status", accessor: "status" },
        ]}
        data={rows}
        noDataMessage="No completed rides match your filters."
      />
    </AdminPageShell>
  );
}
