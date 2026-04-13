import type { ActiveRidePass } from "./types";
import { RIDE_PASS_PLANS } from "./plan-catalog";

interface RidePassRow {
  id: string;
  plan_name: string;
  rides_total: number;
  rides_remaining: number;
  price_paid: string | number;
  status: string;
  purchased_at: string;
  expires_at: string;
}

export function mapRidePassRowToActivePass(row: RidePassRow): ActiveRidePass {
  const plan =
    RIDE_PASS_PLANS.find((p) => p.tier === row.plan_name) ?? RIDE_PASS_PLANS[0];

  return {
    id: row.id,
    plan,
    status: row.status as "active" | "cancelled" | "expired",
    purchaseDate: row.purchased_at,
    renewsOn: row.expires_at,
    usedRides: row.rides_total - row.rides_remaining,
    route: {
      from: { lat: 35.1495, lng: -90.049, address: "Home" },
      to: { lat: 35.1174, lng: -89.9711, address: "Office" },
    },
  };
}
