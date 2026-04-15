'use server'

import { createServiceRoleClient, createServerAuthClient } from '@/lib/supabase-server'
import type { AdminRequest } from './types'
import {
  applyAdminRequestFilters,
  mapRideRowsToAdminRequests,
  type AdminRequestsQuery,
  type RideRequestRow,
} from './requests-helpers'

const REQUEST_STATUSES = ['requested', 'matching', 'driver_assigned'] as const

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

export async function fetchAdminRequests(
  query: AdminRequestsQuery = {}
): Promise<AdminRequest[]> {
  await requireAdminRole()

  const serviceClient = createServiceRoleClient()
  const { data: rideRows, error: rideError } = await serviceClient
    .from('rides')
    .select(
      'id, rider_id, pickup_address, dropoff_address, status, requested_at, scheduled_for, is_child_safe_required'
    )
    .is('deleted_at', null)
    .in('status', [...REQUEST_STATUSES])
    .order('requested_at', { ascending: false })

  if (rideError) {
    throw new Error(rideError.message)
  }

  if (!rideRows || rideRows.length === 0) {
    return []
  }

  const riderIds = Array.from(new Set(rideRows.map((row) => row.rider_id)))
  const { data: riderRows, error: riderError } = await serviceClient
    .from('riders')
    .select('id, name')
    .in('id', riderIds)
    .is('deleted_at', null)

  if (riderError) {
    throw new Error(riderError.message)
  }

  const ridersById = new Map((riderRows ?? []).map((row) => [row.id, row.name]))
  const mapped = mapRideRowsToAdminRequests(
    rideRows as RideRequestRow[],
    ridersById
  )

  return applyAdminRequestFilters(mapped, query)
}
