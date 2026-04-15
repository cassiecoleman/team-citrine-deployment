import AdminDataTable from '@/features/admin-dashboard/components/AdminDataTable'
import AdminPageShell from '@/features/admin-dashboard/components/AdminPageShell'
import { adminRequests } from '@/features/admin-dashboard/constants'
import { fetchAdminRequests } from '@/features/admin-dashboard/requests-actions'
import {
  applyAdminRequestFilters,
  type AdminRequestsQuery,
} from '@/features/admin-dashboard/requests-helpers'

function getValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string | string[]
    status?: string | string[]
    requestType?: string | string[]
    childSafe?: string | string[]
    sort?: string | string[]
  }>
}) {
  const params = await searchParams

  const query: AdminRequestsQuery = {
    search: getValue(params.search),
    status: getValue(params.status),
    requestType: getValue(params.requestType),
    childSafe: getValue(params.childSafe),
    sort: getValue(params.sort),
  }

  let requests = adminRequests
  try {
    requests = await fetchAdminRequests(query)
  } catch {
    requests = applyAdminRequestFilters(adminRequests, query)
  }

  const rows = requests.map((request) => ({
    requestId: request.requestId,
    rider: request.riderName,
    pickup: request.pickupAddress,
    dropoff: request.dropoffAddress,
    status: request.status,
    type: request.requestType,
    childSafe: request.childSafeRequired ? 'Required' : 'Not required',
    requestedAt: new Date(request.requestedAt).toLocaleString(),
    scheduledFor: request.scheduledFor
      ? new Date(request.scheduledFor).toLocaleString()
      : 'Now',
  }))

  return (
    <AdminPageShell
      title="Pending Ride Requests"
      description="US22/US25: review pending requests with real backend search, filter, and sorting."
    >
      <form className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5" method="GET">
        <input
          aria-label="Search ride requests"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.search}
          name="search"
          placeholder="Search rider, pickup, dropoff, ID"
          type="search"
        />

        <select
          aria-label="Filter by status"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.status || 'all'}
          name="status"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="matching">Matching</option>
          <option value="assigned">Assigned</option>
        </select>

        <select
          aria-label="Filter by request type"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.requestType || 'all'}
          name="requestType"
        >
          <option value="all">All request types</option>
          <option value="immediate">Immediate</option>
          <option value="scheduled">Scheduled</option>
        </select>

        <select
          aria-label="Filter by child-safe requirement"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.childSafe || 'all'}
          name="childSafe"
        >
          <option value="all">All child-safe settings</option>
          <option value="required">Child-safe required</option>
          <option value="not_required">Child-safe not required</option>
        </select>

        <div className="flex gap-2">
          <select
            aria-label="Sort requests"
            className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            defaultValue={query.sort || 'requested_desc'}
            name="sort"
          >
            <option value="requested_desc">Newest requested</option>
            <option value="requested_asc">Oldest requested</option>
            <option value="scheduled_asc">Scheduled soonest</option>
            <option value="scheduled_desc">Scheduled latest</option>
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
          { header: 'Request ID', accessor: 'requestId' },
          { header: 'Rider', accessor: 'rider' },
          { header: 'Pickup', accessor: 'pickup' },
          { header: 'Dropoff', accessor: 'dropoff' },
          { header: 'Status', accessor: 'status' },
          { header: 'Type', accessor: 'type' },
          { header: 'Child-safe', accessor: 'childSafe' },
          { header: 'Requested', accessor: 'requestedAt' },
          { header: 'Scheduled', accessor: 'scheduledFor' },
        ]}
        data={rows}
        noDataMessage="No pending requests match your search and filters."
      />
    </AdminPageShell>
  )
}
