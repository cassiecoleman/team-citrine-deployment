import { promises as fs } from "node:fs";

type DemoRideStatus =
  | "requested"
  | "matching"
  | "driver_en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

const DEMO_STATE_PATH = "/tmp/ultra-demo-ride-state.json";

async function readDemoState(): Promise<Record<string, DemoRideStatus>> {
  try {
    const raw = await fs.readFile(DEMO_STATE_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, DemoRideStatus>;
  } catch {
    return {};
  }
}

async function writeDemoState(
  state: Record<string, DemoRideStatus>,
): Promise<void> {
  await fs.writeFile(DEMO_STATE_PATH, JSON.stringify(state), "utf-8");
}

export async function ensureDemoRide(rideId: string): Promise<void> {
  if (!rideId) {
    return;
  }

  const state = await readDemoState();
  if (!state[rideId]) {
    state[rideId] = "matching";
    await writeDemoState(state);
  }
}

export async function getDemoRideStatus(
  rideId: string,
): Promise<DemoRideStatus | undefined> {
  const state = await readDemoState();
  return state[rideId];
}

export async function setDemoRideStatus(
  rideId: string,
  status: DemoRideStatus,
): Promise<void> {
  if (!rideId) {
    return;
  }

  const state = await readDemoState();
  state[rideId] = status;
  await writeDemoState(state);
}

export async function getDemoQueueRideId(): Promise<string | undefined> {
  const state = await readDemoState();
  for (const [rideId, status] of Object.entries(state)) {
    if (status === "matching") {
      return rideId;
    }
  }
  return undefined;
}

export async function resetDemoRideState(): Promise<void> {
  await writeDemoState({});
}
