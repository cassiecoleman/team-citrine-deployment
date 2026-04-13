type DemoRideStatus =
  | "requested"
  | "matching"
  | "driver_en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

interface DemoRideRecord {
  status: DemoRideStatus;
  updatedAt: number;
}

const demoRideState = new Map<string, DemoRideRecord>();

export function ensureDemoRide(rideId: string): void {
  if (!rideId) {
    return;
  }

  if (!demoRideState.has(rideId)) {
    demoRideState.set(rideId, {
      status: "matching",
      updatedAt: Date.now(),
    });
  }
}

export function getDemoRideStatus(rideId: string): DemoRideStatus | undefined {
  return demoRideState.get(rideId)?.status;
}

export function setDemoRideStatus(rideId: string, status: DemoRideStatus): void {
  if (!rideId) {
    return;
  }

  demoRideState.set(rideId, {
    status,
    updatedAt: Date.now(),
  });
}

export function getDemoQueueRideId(): string | undefined {
  for (const [rideId, record] of demoRideState.entries()) {
    if (record.status === "matching") {
      return rideId;
    }
  }
  return undefined;
}

export function resetDemoRideState(): void {
  demoRideState.clear();
}
