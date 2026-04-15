// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  mapFlagRowsToAdminFlags,
  applyAdminFlagFilters,
  formatReason,
  formatFlagStatus,
} from "../flags-helpers";

const sampleRows = [
  {
    id: "flag-1",
    driver_id: "driver-1",
    reporter_id: "rider-1",
    ride_id: "ride-1",
    reason: "safety",
    details: "Ran a red light",
    status: "pending",
    admin_notes: null,
    reviewed_at: null,
    created_at: "2026-04-14T10:00:00Z",
  },
  {
    id: "flag-2",
    driver_id: "driver-2",
    reporter_id: "rider-2",
    ride_id: null,
    reason: "behavior",
    details: "Rude to passengers",
    status: "resolved",
    admin_notes: "Warned driver",
    reviewed_at: "2026-04-14T12:00:00Z",
    created_at: "2026-04-13T08:00:00Z",
  },
];

const driversById = new Map([
  ["driver-1", "Marcus Bell"],
  ["driver-2", "Jane Smith"],
]);

const ridersById = new Map([
  ["rider-1", "Jacob Moore"],
  ["rider-2", "Aisha R."],
]);

describe("admin flags helpers", () => {
  it("maps flag rows to AdminDriverFlag objects with names", () => {
    const flags = mapFlagRowsToAdminFlags(sampleRows, driversById, ridersById);

    expect(flags).toHaveLength(2);
    expect(flags[0].driverName).toBe("Marcus Bell");
    expect(flags[0].reporterName).toBe("Jacob Moore");
    expect(flags[0].reason).toBe("safety");
    expect(flags[0].status).toBe("pending");
    expect(flags[1].driverName).toBe("Jane Smith");
    expect(flags[1].adminNotes).toBe("Warned driver");
  });

  it("filters by status", () => {
    const flags = mapFlagRowsToAdminFlags(sampleRows, driversById, ridersById);
    const pending = applyAdminFlagFilters(flags, { status: "pending" });

    expect(pending).toHaveLength(1);
    expect(pending[0].flagId).toBe("flag-1");
  });

  it("filters by reason", () => {
    const flags = mapFlagRowsToAdminFlags(sampleRows, driversById, ridersById);
    const behavior = applyAdminFlagFilters(flags, { reason: "behavior" });

    expect(behavior).toHaveLength(1);
    expect(behavior[0].flagId).toBe("flag-2");
  });

  it("searches across driver name, reporter name, and details", () => {
    const flags = mapFlagRowsToAdminFlags(sampleRows, driversById, ridersById);
    const results = applyAdminFlagFilters(flags, { search: "red light" });

    expect(results).toHaveLength(1);
    expect(results[0].details).toBe("Ran a red light");
  });

  it("sorts by oldest first", () => {
    const flags = mapFlagRowsToAdminFlags(sampleRows, driversById, ridersById);
    const sorted = applyAdminFlagFilters(flags, { sort: "oldest" });

    expect(sorted[0].flagId).toBe("flag-2");
    expect(sorted[1].flagId).toBe("flag-1");
  });

  it("formats reason labels", () => {
    expect(formatReason("safety")).toBe("Safety");
    expect(formatReason("behavior")).toBe("Behavior");
    expect(formatReason("vehicle")).toBe("Vehicle");
    expect(formatReason("other")).toBe("Other");
  });

  it("formats status labels", () => {
    expect(formatFlagStatus("pending")).toBe("Pending");
    expect(formatFlagStatus("under_review")).toBe("Under Review");
    expect(formatFlagStatus("resolved")).toBe("Resolved");
    expect(formatFlagStatus("dismissed")).toBe("Dismissed");
  });
});
