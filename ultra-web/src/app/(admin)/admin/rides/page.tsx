import AdminDataTable from '@/features/admin-dashboard/components/AdminDataTable'
import AdminPageShell from '@/features/admin-dashboard/components/AdminPageShell'
import { adminRides } from '@/features/admin-dashboard/constants'
import { getActiveRides } from '@/features/admin-dashboard/rides-actions'
import {
  filterAndSortActiveRides,
  type ActiveRidesQuery,
} from '@/features/admin-dashboard/rides-helpers'

function getValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default async function AdminRidesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string | string[]
    status?: string | string[]
    dateFrom?: string | string[]
    dateTo?: string | string[]
    sort?: string | string[]
  }>
}) {
  const params = await searchParams

  const query: ActiveRidesQuery = {
    search: getValue(params.search),
    status: getValue(params.status),
    dateFrom: getValue(params.dateFrom),
    dateTo: getValue(params.dateTo),
    sort: getValue(params.sort),
  }

  let rides = adminRides
  try {
    rides = await getActiveRides(query)
  } catch {
    rides = filterAndSortActiveRides(adminRides, query)
  }

  const rows = rides.map((ride) => ({
    rideId: ride.rideId,
    rider: ride.riderName,
    driver: ride.driverName,
    origin: ride.origin,
    status: ride.status,
    startedAt: ride.startedAt ? new Date(ride.startedAt).toLocaleString() : '—',
    fare: ride.fare !== null ? `$${ride.fare.toFixed(2)}` : '—',
  }))

  return (
    <AdminPageShell title="Active Rides" description="US23: track in-progress rides with real backend search and sorting.">
      <form className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5" method="GET">
        <input
          aria-label="Search active rides"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.search}
          name="search"
          placeholder="Search ride, rider, driver"
          type="search"
        />

        <select
          aria-label="Filter active rides by status"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.status || 'all'}
          name="status"
        >
          <option value="all">All statuses</option>
          <option value="driver en route">Driver En Route</option>
          <option value="arrived">Arrived</option>
          <option value="in progress">In Progress</option>
        </select>

        <input
          aria-label="Filter active rides from date"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.dateFrom}
          name="dateFrom"
          type="date"
        />

        <input
          aria-label="Filter active rides to date"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          defaultValue={query.dateTo}
          name="dateTo"
          type="date"
        />

        <div className="flex gap-2">
          <select
            aria-label="Sort active rides"
            className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            defaultValue={query.sort || 'started_desc'}
            name="sort"
          >
            <option value="started_desc">Start time newest</option>
            <option value="started_asc">Start time oldest</option>
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
          { header: 'Ride ID', accessor: 'rideId' },
          { header: 'Rider', accessor: 'rider' },
          { header: 'Driver', accessor: 'driver' },
          { header: 'Origin', accessor: 'origin' },
          { header: 'Status', accessor: 'status' },
          { header: 'Started', accessor: 'startedAt' },
          { header: 'Fare', accessor: 'fare' },
        ]}
        data={rows}
        noDataMessage="No active rides match your filters."
      />
    </AdminPageShell>
  )
}
