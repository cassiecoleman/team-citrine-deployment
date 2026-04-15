import type { Database } from '@/types/supabase'
import type { AdminCompletedRide, AdminRide } from './types'

type RideRowBase = Pick<
  Database['public']['Tables']['rides']['Row'],
  | 'id'
  | 'rider_id'
  | 'driver_id'
  | 'pickup_address'
  | 'status'
  | 'pickup_at'
  | 'completed_at'
  | 'fare_final'
  | 'distance_miles'
>

export type ActiveRideRow = RideRowBase
export type CompletedRideRow = RideRowBase

export type ActiveRidesQuery = {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  sort?: string
}

export type CompletedRidesQuery = {
  search?: string
  dateFrom?: string
  dateTo?: string
  fareMin?: string
  fareMax?: string
  sort?: string
  page?: string
  pageSize?: string
}

function toStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase()
  const map: Record<string, string> = {
    driver_en_route: 'Driver En Route',
    arrived: 'Arrived',
    in_progress: 'In Progress',
    completed: 'Completed',
  }

  return (
    map[normalized] ??
    normalized
      .split('_')
      .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
      .join(' ')
  )
}

function inDateRange(isoDate: string | null, dateFrom?: string, dateTo?: string): boolean {
  if (!isoDate) return false
  const value = new Date(isoDate).getTime()
  if (Number.isNaN(value)) return false

  const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`).getTime() : null
  const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999Z`).getTime() : null

  if (fromTime !== null && !Number.isNaN(fromTime) && value < fromTime) return false
  if (toTime !== null && !Number.isNaN(toTime) && value > toTime) return false
  return true
}

export function mapRideRowsToAdminActiveRides(
  rows: ActiveRideRow[],
  ridersById: Map<string, string>,
  driversById: Map<string, string>
): AdminRide[] {
  return rows.map((row) => ({
    rideId: row.id,
    riderName: ridersById.get(row.rider_id) ?? 'Unknown rider',
    driverName: row.driver_id ? driversById.get(row.driver_id) ?? 'Unassigned' : 'Unassigned',
    origin: row.pickup_address,
    status: toStatusLabel(row.status),
    startedAt: row.pickup_at,
    fare: row.fare_final,
  }))
}

export function mapRideRowsToAdminCompletedRides(
  rows: CompletedRideRow[],
  ridersById: Map<string, string>,
  driversById: Map<string, string>
): AdminCompletedRide[] {
  return rows.map((row) => ({
    rideId: row.id,
    riderName: ridersById.get(row.rider_id) ?? 'Unknown rider',
    driverName: row.driver_id ? driversById.get(row.driver_id) ?? 'Unknown driver' : 'Unknown driver',
    distance: row.distance_miles !== null ? `${row.distance_miles.toFixed(1)} mi` : '—',
    status: toStatusLabel(row.status),
    completedAt: row.completed_at,
    fare: row.fare_final,
  }))
}

export function filterAndSortActiveRides(
  rides: AdminRide[],
  query: ActiveRidesQuery
): AdminRide[] {
  const normalizedSearch = query.search?.trim().toLowerCase() ?? ''
  const normalizedStatus = query.status?.trim().toLowerCase() ?? 'all'
  const sortMode = query.sort?.trim().toLowerCase() ?? 'started_desc'

  const filtered = rides.filter((ride) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      ride.rideId.toLowerCase().includes(normalizedSearch) ||
      ride.riderName.toLowerCase().includes(normalizedSearch) ||
      ride.driverName.toLowerCase().includes(normalizedSearch)

    const matchesStatus =
      normalizedStatus === 'all' || ride.status.toLowerCase() === normalizedStatus

    const matchesDate =
      !query.dateFrom && !query.dateTo
        ? true
        : inDateRange(ride.startedAt, query.dateFrom, query.dateTo)

    return matchesSearch && matchesStatus && matchesDate
  })

  return filtered.sort((a, b) => {
    const timeA = new Date(a.startedAt ?? 0).getTime()
    const timeB = new Date(b.startedAt ?? 0).getTime()
    if (sortMode === 'started_asc') return timeA - timeB
    return timeB - timeA
  })
}

export function filterAndSortCompletedRides(
  rides: AdminCompletedRide[],
  query: CompletedRidesQuery
): AdminCompletedRide[] {
  const normalizedSearch = query.search?.trim().toLowerCase() ?? ''
  const fareMin = query.fareMin ? Number(query.fareMin) : null
  const fareMax = query.fareMax ? Number(query.fareMax) : null
  const sortMode = query.sort?.trim().toLowerCase() ?? 'completed_desc'

  const filtered = rides.filter((ride) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      ride.rideId.toLowerCase().includes(normalizedSearch) ||
      ride.riderName.toLowerCase().includes(normalizedSearch) ||
      ride.driverName.toLowerCase().includes(normalizedSearch)

    const matchesDate =
      !query.dateFrom && !query.dateTo
        ? true
        : inDateRange(ride.completedAt, query.dateFrom, query.dateTo)

    const fare = ride.fare ?? 0
    const matchesFareMin = fareMin === null || Number.isNaN(fareMin) || fare >= fareMin
    const matchesFareMax = fareMax === null || Number.isNaN(fareMax) || fare <= fareMax

    return matchesSearch && matchesDate && matchesFareMin && matchesFareMax
  })

  return filtered.sort((a, b) => {
    if (sortMode === 'fare_asc') return (a.fare ?? 0) - (b.fare ?? 0)
    if (sortMode === 'fare_desc') return (b.fare ?? 0) - (a.fare ?? 0)

    const timeA = new Date(a.completedAt ?? 0).getTime()
    const timeB = new Date(b.completedAt ?? 0).getTime()
    if (sortMode === 'completed_asc') return timeA - timeB
    return timeB - timeA
  })
}
