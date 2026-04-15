import { describe, expect, it } from 'vitest'
import {
  filterAndSortActiveRides,
  filterAndSortCompletedRides,
  mapRideRowsToAdminActiveRides,
  mapRideRowsToAdminCompletedRides,
  type ActiveRidesQuery,
  type CompletedRidesQuery,
} from '../rides-helpers'

describe('admin rides helpers', () => {
  it('filters active rides by search/status/date and sorts by start time', () => {
    const active = mapRideRowsToAdminActiveRides(
      [
        {
          id: 'ride-a',
          rider_id: 'r-1',
          driver_id: 'd-1',
          pickup_address: 'North Clinic',
          status: 'in_progress',
          pickup_at: '2026-04-13T10:00:00.000Z',
          completed_at: null,
          fare_final: 12,
          distance_miles: 3.3,
        },
        {
          id: 'ride-b',
          rider_id: 'r-2',
          driver_id: 'd-2',
          pickup_address: 'South Clinic',
          status: 'arrived',
          pickup_at: '2026-04-14T12:00:00.000Z',
          completed_at: null,
          fare_final: 18,
          distance_miles: 5.1,
        },
      ],
      new Map([
        ['r-1', 'Amina Rose'],
        ['r-2', 'Carlos Vega'],
      ]),
      new Map([
        ['d-1', 'Jonah Reid'],
        ['d-2', 'Maria Lopez'],
      ])
    )

    const query: ActiveRidesQuery = {
      search: 'carlos',
      status: 'arrived',
      dateFrom: '2026-04-14',
      sort: 'started_desc',
    }

    const filtered = filterAndSortActiveRides(active, query)

    expect(filtered).toHaveLength(1)
    expect(filtered[0]).toMatchObject({
      rideId: 'ride-b',
      riderName: 'Carlos Vega',
      status: 'Arrived',
    })
  })

  it('filters completed rides by search/fare/date and sorts by fare desc', () => {
    const completed = mapRideRowsToAdminCompletedRides(
      [
        {
          id: 'ride-1',
          rider_id: 'r-1',
          driver_id: 'd-1',
          pickup_address: 'A',
          status: 'completed',
          completed_at: '2026-04-10T10:00:00.000Z',
          fare_final: 14,
          distance_miles: 4.2,
        },
        {
          id: 'ride-2',
          rider_id: 'r-2',
          driver_id: 'd-2',
          pickup_address: 'B',
          status: 'completed',
          completed_at: '2026-04-12T10:00:00.000Z',
          fare_final: 26,
          distance_miles: 7.1,
        },
      ],
      new Map([
        ['r-1', 'Maya Brooks'],
        ['r-2', 'Derek Yuan'],
      ]),
      new Map([
        ['d-1', 'Jonah Reid'],
        ['d-2', 'Maria Lopez'],
      ])
    )

    const query: CompletedRidesQuery = {
      search: 'derek',
      dateFrom: '2026-04-11',
      fareMin: '20',
      sort: 'fare_desc',
    }

    const filtered = filterAndSortCompletedRides(completed, query)

    expect(filtered).toHaveLength(1)
    expect(filtered[0]).toMatchObject({
      rideId: 'ride-2',
      riderName: 'Derek Yuan',
      driverName: 'Maria Lopez',
      fare: 26,
    })
  })
})
