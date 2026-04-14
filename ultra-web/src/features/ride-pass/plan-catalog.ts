import type { RidePassPlan } from "./types";

export const RIDE_PASS_PLANS: RidePassPlan[] = [
  {
    id: "plan-5",
    tier: "weekly-5",
    ridesPerWeek: 5,
    pricePerWeek: 75,
    pricePerRide: 15,
    savingsPerWeek: 25,
    recommended: true,
  },
  {
    id: "plan-10",
    tier: "weekly-10",
    ridesPerWeek: 10,
    pricePerWeek: 140,
    pricePerRide: 14,
    savingsPerWeek: 60,
    recommended: false,
  },
];
