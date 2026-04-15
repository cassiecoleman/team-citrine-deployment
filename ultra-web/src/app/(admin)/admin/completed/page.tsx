import AdminDataTable from '@/features/admin-dashboard/components/AdminDataTable'
import AdminPageShell from '@/features/admin-dashboard/components/AdminPageShell'
import { adminCompletedRides } from '@/features/admin-dashboard/constants'
import { getCompletedRides } from '@/features/admin-dashboard/rides-actions'
import {
  filterAndSortCompletedRides,
  type CompletedRidesQuery,
} from '@/features/admin-dashboard/rides-helpers'

function getValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default async function AdminCompletedRidesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string | string[]
    dateFrom?: string | string[]
    dateTo?: string | string[]
    fareMin?: string | string[]
    fareMax?: string | string[]
    sort?: string | string[]
    page?: string | string[]
  }>
}) {
  const params = await searchParams

  const query: CompletedRidesQuery = {
    search: getValue(params.search),
    dateFrom: getValue(params.dateFrom),
    dateTo: getValue(params.dateTo),
    fareMin: getValue(params.fareMin),
    fareMax: getValue(params.fareMax),
    sort: getValue(params.sort),
    page: getValue(params.page),
    pageSize: '10',
  }

  // TODO(security): same silent-fallback pattern as /admin/rides and
  // /admin/requests — catch masks Forbidden + real outages. Middleware
  // (#18) is the current trust boundary for /admin/*. Follow-up:
  // surface real failures and differentiate env-missing from auth
  // failure.
  let rides = adminCompletedRides
  let page = 1
  let totalPages = 0

  try {
    const result = await getCompletedRides(query)
    rides = result.rides
    page = result.page
    totalPages = result.totalPages
  } catch {
    const filtered = filterAndSortCompletedRides(adminCompletedRides, query)
    page = Number.parseInt(query.page ?? '1', 10) || 1
    totalPages = filtered.length === 0 ? 0 : Math.ceil(filtered.length / 10)
    rides = filtered.slice((page - 1) * 10, page * 10)
  }

  const rows = rides.map((ride) => ({
    rideId: ride.rideId,
    rider: ride.riderName,
    driver: ride.driverName,
    distance: ride.distance,
    status: ride.status,
    completedAt: ride.completedAt ? new Date(ride.completedAt).toLocaleString() : '—',
    fare: ride.fare !== null ? `$${ride.fare.toFixed(2)}` : '—',
  }))

  return (
    <AdminPageShell title="Completed Rides" description="US24/US25: completed ride search, filters, sorting, and pagination.">
      <form className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4" method="GET">
        <input
          aria-label="Search completed rides"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.search}
          name="search"
          placeholder="Search ride, rider, driver"
          type="search"
        />

        <input
          aria-label="Filter completed rides from date"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.dateFrom}
          name="dateFrom"
          type="date"
        />

        <input
          aria-label="Filter completed rides to date"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.dateTo}
          name="dateTo"
          type="date"
        />

        <select
          aria-label="Sort completed rides"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.sort || 'completed_desc'}
          name="sort"
        >
          <option value="completed_desc">Completed newest</option>
          <option value="completed_asc">Completed oldest</option>
          <option value="fare_desc">Fare highest</option>
          <option value="fare_asc">Fare lowest</option>
        </select>

        <input
          aria-label="Filter completed rides min fare"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.fareMin}
          min="0"
          name="fareMin"
          placeholder="Min fare"
          step="0.01"
          type="number"
        />

        <input
          aria-label="Filter completed rides max fare"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.fareMax}
          min="0"
          name="fareMax"
          placeholder="Max fare"
          step="0.01"
          type="number"
        />

        <div className="flex gap-2 lg:col-span-2">
          <input type="hidden" name="page" value="1" />
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
          { header: 'Ride ID', accessor: 'rideId' },
          { header: 'Rider', accessor: 'rider' },
          { header: 'Driver', accessor: 'driver' },
          { header: 'Distance', accessor: 'distance' },
          { header: 'Status', accessor: 'status' },
          { header: 'Completed', accessor: 'completedAt' },
          { header: 'Fare', accessor: 'fare' },
        ]}
        data={rows}
        noDataMessage="No completed rides match your filters."
      />

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>Page {page}{totalPages > 0 ? ` of ${totalPages}` : ''}</span>
        <div className="flex gap-2">
          <a
            aria-disabled={page <= 1}
            className="rounded border border-border px-3 py-1 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            href={`?search=${encodeURIComponent(query.search ?? '')}&dateFrom=${encodeURIComponent(query.dateFrom ?? '')}&dateTo=${encodeURIComponent(query.dateTo ?? '')}&fareMin=${encodeURIComponent(query.fareMin ?? '')}&fareMax=${encodeURIComponent(query.fareMax ?? '')}&sort=${encodeURIComponent(query.sort ?? 'completed_desc')}&page=${Math.max(1, page - 1)}`}
          >
            Previous
          </a>
          <a
            aria-disabled={totalPages === 0 || page >= totalPages}
            className="rounded border border-border px-3 py-1 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            href={`?search=${encodeURIComponent(query.search ?? '')}&dateFrom=${encodeURIComponent(query.dateFrom ?? '')}&dateTo=${encodeURIComponent(query.dateTo ?? '')}&fareMin=${encodeURIComponent(query.fareMin ?? '')}&fareMax=${encodeURIComponent(query.fareMax ?? '')}&sort=${encodeURIComponent(query.sort ?? 'completed_desc')}&page=${page + 1}`}
          >
            Next
          </a>
        </div>
      </div>
    </AdminPageShell>
  )
}
