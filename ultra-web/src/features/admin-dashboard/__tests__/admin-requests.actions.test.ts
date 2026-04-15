import { describe, expect, it } from "vitest";
import {
  applyAdminRequestFilters,
  mapRideRowsToAdminRequests,
  type AdminRequestsQuery,
} from "../requests-helpers";

describe("admin requests actions", () => {
  it("filters by search/status/type/child-safe and sorts by requested date", () => {
    const requests = mapRideRowsToAdminRequests(
      [
        {
          id: "ride-1",
          rider_id: "r-1",
          pickup_address: "120 Main St",
          dropoff_address: "City Hospital",
          status: "requested",
          requested_at: "2026-04-10T10:00:00.000Z",
          scheduled_for: null,
          is_child_safe_required: false,
        },
        {
          id: "ride-2",
          rider_id: "r-2",
          pickup_address: "80 Oak Ave",
          dropoff_address: "Memphis Central",
          status: "matching",
          requested_at: "2026-04-12T09:00:00.000Z",
          scheduled_for: "2026-04-15T12:00:00.000Z",
          is_child_safe_required: true,
        },
      ],
      new Map([
        ["r-1", "Maya Brooks"],
        ["r-2", "Derek Yuan"],
      ]),
    );

    const query: AdminRequestsQuery = {
      search: "derek",
      status: "matching",
      requestType: "scheduled",
      childSafe: "required",
      sort: "requested_desc",
    };

    const filtered = applyAdminRequestFilters(requests, query);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toMatchObject({
      requestId: "ride-2",
      riderName: "Derek Yuan",
      requestType: "Scheduled",
      childSafeRequired: true,
      status: "Matching",
    });
  });

  it("accepts database status aliases in the status filter", () => {
    const requests = mapRideRowsToAdminRequests(
      [
        {
          id: "ride-100",
          rider_id: "r-100",
          pickup_address: "4 Elm St",
          dropoff_address: "County Office",
          status: "requested",
          requested_at: "2026-04-09T08:00:00.000Z",
          scheduled_for: null,
          is_child_safe_required: false,
        },
      ],
      new Map([["r-100", "Zoe Patel"]]),
    );

    const filtered = applyAdminRequestFilters(requests, { status: "requested" });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].status).toBe("Pending");
  });
});
