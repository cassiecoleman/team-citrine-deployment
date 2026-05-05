import AdminPageShell from "@/features/admin-dashboard/components/AdminPageShell";
import AdminDataTable from "@/features/admin-dashboard/components/AdminDataTable";
import { fetchDrivers } from "@/features/admin-dashboard/actions";
import type { AdminDriver } from "@/features/admin-dashboard/types";

function getValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AdminDriversPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string | string[];
    status?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const search = getValue(params.search).trim();
  const status = getValue(params.status) || "All";

  const allDrivers = await fetchDrivers();
  const visibleDrivers = allDrivers.filter((driver: AdminDriver) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      searchLower.length === 0 ||
      driver.id.toLowerCase().includes(searchLower) ||
      driver.name.toLowerCase().includes(searchLower);
    const matchesStatus = status === "All" || driver.status === status;
    return matchesSearch && matchesStatus;
  });

  const rows = visibleDrivers.map((driver) => ({
    driverId: driver.id,
    name: driver.name,
    status: driver.status,
    rating: driver.rating,
    lastActive: driver.lastActive,
  }));

  return (
    <AdminPageShell title="All Drivers" description="US21: monitor and manage the full driver roster.">
      <form className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center" method="GET">
        <input
          aria-label="Search records"
          className="w-full sm:w-96 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={search}
          name="search"
          placeholder="Search"
          type="search"
        />
        <select
          aria-label="Driver Status"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={status}
          name="status"
        >
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Offline">Offline</option>
        </select>
        <button
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-slate-100"
          type="submit"
        >
          Apply
        </button>
      </form>
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
