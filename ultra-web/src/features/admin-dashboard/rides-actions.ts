'use server'

import { createServiceRoleClient, createServerAuthClient } from '@/lib/supabase-server'
import type { AdminCompletedRide, AdminRide } from './types'
import {
  filterAndSortActiveRides,
  filterAndSortCompletedRides,
  mapRideRowsToAdminActiveRides,
  mapRideRowsToAdminCompletedRides,
  type ActiveRideRow,
  type ActiveRidesQuery,
  type CompletedRideRow,
  type CompletedRidesQuery,
} from './rides-helpers'

const ACTIVE_STATUSES = ['driver_en_route', 'arrived', 'in_progress'] as const

async function requireAdminRole(): Promise<void> {
  const authClient = await createServerAuthClient()
  const { data: authData, error: authError } = await authClient.auth.getUser()

  if (authError || !authData?.user) {
    throw new Error('Unauthorized')
  }

  const serviceClient = createServiceRoleClient()
  const { data: roleData, error: roleError } = await serviceClient
    .from('user_roles')
    .select('role')
    .eq('user_id', authData.user.id)
    .is('deleted_at', null)
    .single()

  if (roleError || roleData?.role !== 'admin') {
    throw new Error('Forbidden')
  }
}

async function hydrateNameMaps(rideRows: Array<{ rider_id: string; driver_id: string | null }>) {
  const riderIds = Array.from(new Set(rideRows.map((row) => row.rider_id)))
  const driverIds = Array.from(
    new Set(rideRows.map((row) => row.driver_id).filter((id): id is string => Boolean(id)))
  )

  const serviceClient = createServiceRoleClient()
  const [ridersResult, driversResult] = await Promise.all([
    riderIds.length > 0
      ? serviceClient.from('riders').select('id, name').in('id', riderIds).is('deleted_at', null)
      : Promise.resolve({ data: [], error: null }),
    driverIds.length > 0
      ? serviceClient.from('drivers').select('id, name').in('id', driverIds).is('deleted_at', null)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (ridersResult.error) throw new Error(ridersResult.error.message)
  if (driversResult.error) throw new Error(driversResult.error.message)

  const ridersById = new Map((ridersResult.data ?? []).map((row) => [row.id, row.name]))
  const driversById = new Map((driversResult.data ?? []).map((row) => [row.id, row.name]))

  return { ridersById, driversById }
}

export async function getActiveRides(query: ActiveRidesQuery = {}): Promise<AdminRide[]> {
  await requireAdminRole()

  const serviceClient = createServiceRoleClient()
  const { data: rideRows, error: ridesError } = await serviceClient
    .from('rides')
    .select(
      'id, rider_id, driver_id, pickup_address, status, pickup_at, completed_at, fare_final, distance_miles'
    )
    .is('deleted_at', null)
    .in('status', [...ACTIVE_STATUSES])
    .order('pickup_at', { ascending: false })

  if (ridesError) throw new Error(ridesError.message)
  if (!rideRows || rideRows.length === 0) return []

  const { ridersById, driversById } = await hydrateNameMaps(rideRows)
  const mapped = mapRideRowsToAdminActiveRides(
    rideRows as ActiveRideRow[],
    ridersById,
    driversById
  )

  return filterAndSortActiveRides(mapped, query)
}

export type CompletedRidesResult = {
  rides: AdminCompletedRide[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getCompletedRides(
  query: CompletedRidesQuery = {}
): Promise<CompletedRidesResult> {
  await requireAdminRole()

  const serviceClient = createServiceRoleClient()
  const { data: rideRows, error: ridesError } = await serviceClient
    .from('rides')
    .select(
      'id, rider_id, driver_id, pickup_address, status, pickup_at, completed_at, fare_final, distance_miles'
    )
    .is('deleted_at', null)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (ridesError) throw new Error(ridesError.message)
  if (!rideRows || rideRows.length === 0) {
    return { rides: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
  }

  const { ridersById, driversById } = await hydrateNameMaps(rideRows)
  const mapped = mapRideRowsToAdminCompletedRides(
    rideRows as CompletedRideRow[],
    ridersById,
    driversById
  )
  const filtered = filterAndSortCompletedRides(mapped, query)

  const requestedPage = Number.parseInt(query.page ?? '1', 10)
  const requestedPageSize = Number.parseInt(query.pageSize ?? '10', 10)
  const pageSize = Number.isFinite(requestedPageSize) && requestedPageSize > 0 ? requestedPageSize : 10
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const total = filtered.length
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const rides = filtered.slice(start, start + pageSize)

  return { rides, total, page, pageSize, totalPages }
}
