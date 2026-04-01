"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageShell from "@/features/admin-dashboard/components/AdminPageShell";
import AdminFilterBar from "@/features/admin-dashboard/components/AdminFilterBar";
import AdminDataTable from "@/features/admin-dashboard/components/AdminDataTable";
import { fetchRequests } from "@/features/admin-dashboard/actions";
import type { AdminRequest } from "@/features/admin-dashboard/types";

export default function AdminRequests() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [requests, setRequests] = useState<AdminRequest[]>([]);

  useEffect(() => {
    void fetchRequests().then(setRequests);
  }, []);

  const visibleRequests = useMemo(() => {
    const searchLower = search.toLowerCase();
    return requests.filter((request) => {
      const matchesSearch =
        request.requestId.toLowerCase().includes(searchLower) ||
        request.partnerName.toLowerCase().includes(searchLower);
      const matchesStatus = status === "All" || request.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, status]);

  const rows = visibleRequests.map((request) => ({
    requestId: request.requestId,
    rider: request.riderName,
    partner: request.partnerName,
    destination: request.destination,
    status: request.status,
  }));

  return (
    <AdminPageShell title="Pending Ride Requests" description="US22: oversee pending ride requests and assign the right driver.">
      <AdminFilterBar
        search={search}
        onSearch={setSearch}
        filter={{
          label: "Request Status",
          value: status,
          options: [
            { value: "All", label: "All" },
            { value: "Pending", label: "Pending" },
            { value: "Accepted", label: "Accepted" },
            { value: "Cancelled", label: "Cancelled" },
          ],
          onChange: setStatus,
        }}
      />
      <AdminDataTable
        columns={[
          { header: "Request ID", accessor: "requestId" },
          { header: "Rider", accessor: "rider" },
          { header: "Partner", accessor: "partner" },
          { header: "Destination", accessor: "destination" },
          { header: "Status", accessor: "status" },
        ]}
        data={rows}
        noDataMessage="No pending requests match your search and filters."
      />
    </AdminPageShell>
  );
}
