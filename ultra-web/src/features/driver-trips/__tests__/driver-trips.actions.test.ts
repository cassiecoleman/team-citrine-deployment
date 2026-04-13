import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getActiveDriverTrip,
  getDriverShiftSummary,
  getQueuedTrip,
} from "../actions";

vi.mock("@/lib/mock-delay", () => ({
  mockDelay: vi.fn().mockResolvedValue(undefined),
}));

describe("driver trip actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current shift summary for the driver dashboard", async () => {
    const summary = await getDriverShiftSummary();

    expect(summary.driverName).toBe("Marcus W.");
    expect(summary.status).toBe("online");
    expect(summary.todayTrips).toBe(8);
    expect(summary.earningsToday).toBe(142.5);
    expect(summary.activeTripId).toBe("test-ride-1");
    expect(summary.pendingQueueCount).toBe(3);
    expect(summary.nextBreakLabel).toContain("2 more trips");
  });

  it("returns the queued trip assignment used on the accept/reject screen", async () => {
    const assignment = await getQueuedTrip();

    expect(assignment.id).toBe("test-ride-1");
    expect(assignment.pickupLabel).toBe("Community Clinic");
    expect(assignment.dropoffLabel).toBe("Metro General Hospital");
    expect(assignment.note).toContain("blue awning");
    expect(assignment.urgencyLabel).toBe("Medical appointment");
    expect(assignment.accessibilityNotes).toHaveLength(2);
  });

  it("maps the active trip payload to the requested trip id", async () => {
    const trip = await getActiveDriverTrip("trip-321");

    expect(trip.id).toBe("trip-321");
    expect(trip.riderName).toBe("Aisha R.");
    expect(trip.routeProgressLabel).toBe("2 turns away from pickup");
    expect(trip.vehicleChecklist).toEqual([
      "Hazards ready for curb pickup",
      "Back seat clear for rider belongings",
      "App PIN ready for verbal confirmation",
    ]);
    expect(trip.pickupCode).toBe("4821");
    expect(trip.riderPhone).toContain("555");
    expect(trip.nextTurn).toContain("River Pkwy");
    expect(trip.destinationEtaMin).toBe(18);
  });
});
