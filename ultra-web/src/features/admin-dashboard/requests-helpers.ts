import type { Database } from '@/types/supabase'
import type { AdminRequest } from './types'

export type RideRequestRow = Pick<
  Database['public']['Tables']['rides']['Row'],
  | 'id'
  | 'rider_id'
  | 'pickup_address'
  | 'dropoff_address'
  | 'status'
  | 'requested_at'
  | 'scheduled_for'
  | 'is_child_safe_required'
>

export type AdminRequestsQuery = {
  search?: string
  status?: string
  requestType?: string
  childSafe?: string
  sort?: string
}

function normalizeStatusFilter(value: string): string {
  if (value === 'requested') {
    return 'pending'
  }
  if (value === 'driver_assigned') {
    return 'assigned'
  }
  return value
}

function toStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase()

  if (normalized === 'requested') {
    return 'Pending'
  }
  if (normalized === 'matching') {
    return 'Matching'
  }
  if (normalized === 'driver_assigned') {
    return 'Assigned'
  }

  return normalized
    .split('_')
    .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
    .join(' ')
}

export function mapRideRowsToAdminRequests(
  rows: RideRequestRow[],
  ridersById: Map<string, string>
): AdminRequest[] {
  return rows.map((row) => ({
    requestId: row.id,
    riderName: ridersById.get(row.rider_id) ?? 'Unknown rider',
    pickupAddress: row.pickup_address,
    dropoffAddress: row.dropoff_address,
    status: toStatusLabel(row.status),
    requestType: row.scheduled_for ? 'Scheduled' : 'Immediate',
    requestedAt: row.requested_at,
    scheduledFor: row.scheduled_for,
    childSafeRequired: row.is_child_safe_required,
  }))
}

export function applyAdminRequestFilters(
  requests: AdminRequest[],
  query: AdminRequestsQuery
): AdminRequest[] {
  // Use || not ?? here: the page passes missing URL params as empty
  // strings (not undefined), and ?? only falls back on null/undefined.
  // An empty status would match no rides and render the page empty.
  const normalizedSearch = (query.search?.trim() || '').toLowerCase()
  const normalizedStatus = normalizeStatusFilter(
    (query.status?.trim() || 'all').toLowerCase()
  )
  const normalizedRequestType = (query.requestType?.trim() || 'all').toLowerCase()
  const normalizedChildSafe = (query.childSafe?.trim() || 'all').toLowerCase()
  const sortMode = (query.sort?.trim() || 'requested_desc').toLowerCase()

  const filtered = requests.filter((request) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      request.requestId.toLowerCase().includes(normalizedSearch) ||
      request.riderName.toLowerCase().includes(normalizedSearch) ||
      request.pickupAddress.toLowerCase().includes(normalizedSearch) ||
      request.dropoffAddress.toLowerCase().includes(normalizedSearch)

    const matchesStatus =
      normalizedStatus === 'all' || request.status.toLowerCase() === normalizedStatus

    const matchesRequestType =
      normalizedRequestType === 'all' ||
      request.requestType.toLowerCase() === normalizedRequestType

    const matchesChildSafe =
      normalizedChildSafe === 'all' ||
      (normalizedChildSafe === 'required' && request.childSafeRequired) ||
      (normalizedChildSafe === 'not_required' && !request.childSafeRequired)

    return (
      matchesSearch &&
      matchesStatus &&
      matchesRequestType &&
      matchesChildSafe
    )
  })

  return filtered.sort((first, second) => {
    if (sortMode === 'requested_asc') {
      return (
        new Date(first.requestedAt).getTime() -
        new Date(second.requestedAt).getTime()
      )
    }

    if (sortMode === 'scheduled_asc') {
      return (
        new Date(first.scheduledFor ?? first.requestedAt).getTime() -
        new Date(second.scheduledFor ?? second.requestedAt).getTime()
      )
    }

    if (sortMode === 'scheduled_desc') {
      return (
        new Date(second.scheduledFor ?? second.requestedAt).getTime() -
        new Date(first.scheduledFor ?? first.requestedAt).getTime()
      )
    }

    return (
      new Date(second.requestedAt).getTime() -
      new Date(first.requestedAt).getTime()
    )
  })
}
