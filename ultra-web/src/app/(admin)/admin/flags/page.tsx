import AdminDataTable from "@/features/admin-dashboard/components/AdminDataTable";
import AdminPageShell from "@/features/admin-dashboard/components/AdminPageShell";
import {
  fetchAdminFlags,
  resolveDriverFlag,
} from "@/features/admin-dashboard/flags-actions";
import {
  formatReason,
  formatFlagStatus,
  type AdminFlagsQuery,
} from "@/features/admin-dashboard/flags-helpers";
import { redirect } from "next/navigation";

function getValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AdminFlagsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string | string[];
    status?: string | string[];
    reason?: string | string[];
    sort?: string | string[];
    resolve?: string | string[];
    resolution?: string | string[];
    adminNotes?: string | string[];
  }>;
}) {
  const params = await searchParams;

  // Handle resolve action
  const resolveId = getValue(params.resolve);
  const resolution = getValue(params.resolution);
  if (resolveId && (resolution === "resolved" || resolution === "dismissed")) {
    await resolveDriverFlag(resolveId, resolution, getValue(params.adminNotes) || undefined);
    redirect("/admin/flags");
  }

  const query: AdminFlagsQuery = {
    search: getValue(params.search),
    status: getValue(params.status),
    reason: getValue(params.reason),
    sort: getValue(params.sort),
  };

  let flags: Awaited<ReturnType<typeof fetchAdminFlags>> = [];
  try {
    flags = await fetchAdminFlags(query);
  } catch {
    // Fall back to empty — no mock data for flags
  }

  const rows = flags.map((flag) => ({
    flagId: flag.flagId.slice(0, 8) + "...",
    driver: flag.driverName,
    reporter: flag.reporterName,
    reason: formatReason(flag.reason),
    details: flag.details ?? "—",
    status: formatFlagStatus(flag.status),
    createdAt: new Date(flag.createdAt).toLocaleString(),
    actions:
      flag.status === "pending" || flag.status === "under_review"
        ? `resolve:${flag.flagId}`
        : flag.adminNotes ?? "—",
  }));

  return (
    <AdminPageShell
      title="Driver Flags"
      description="Review rider complaints about drivers. Resolve or dismiss each flag."
    >
      <form className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4" method="GET">
        <input
          aria-label="Search flags"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.search}
          name="search"
          placeholder="Search driver, reporter, details"
          type="search"
        />

        <select
          aria-label="Filter by status"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.status || "all"}
          name="status"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <select
          aria-label="Filter by reason"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.reason || "all"}
          name="reason"
        >
          <option value="all">All reasons</option>
          <option value="safety">Safety</option>
          <option value="behavior">Behavior</option>
          <option value="vehicle">Vehicle</option>
          <option value="other">Other</option>
        </select>

        <div className="flex gap-2">
          <select
            aria-label="Sort flags"
            className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            defaultValue={query.sort || "newest"}
            name="sort"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <button
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-slate-100"
            type="submit"
          >
            Apply
          </button>
        </div>
      </form>

      <AdminDataTable
        columns={[
          { header: "Flag ID", accessor: "flagId" },
          { header: "Driver", accessor: "driver" },
          { header: "Reporter", accessor: "reporter" },
          { header: "Reason", accessor: "reason" },
          { header: "Details", accessor: "details" },
          { header: "Status", accessor: "status" },
          { header: "Created", accessor: "createdAt" },
          { header: "Actions / Notes", accessor: "actions" },
        ]}
        data={rows.map((r) => ({
          ...r,
          actions: r.actions.startsWith("resolve:")
            ? resolveLinks(r.actions.replace("resolve:", ""))
            : r.actions,
        }))}
        noDataMessage="No driver flags found."
      />
    </AdminPageShell>
  );
}

function resolveLinks(flagId: string) {
  return (
    <span className="flex gap-2">
      <a
        href={`/admin/flags?resolve=${flagId}&resolution=resolved&adminNotes=Reviewed`}
        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
      >
        Resolve
      </a>
      <a
        href={`/admin/flags?resolve=${flagId}&resolution=dismissed&adminNotes=Dismissed`}
        className="rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600"
      >
        Dismiss
      </a>
    </span>
  );
}
