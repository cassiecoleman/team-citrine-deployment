// Fare rate card (all amounts in cents to avoid floating-point drift).
// Chosen to match the documented "base fare + distance + time + service fee"
// breakdown in documentation/backend-modules/05-payments-pricing.md.
const BASE_FARE_CENTS = 250;
const PER_MILE_CENTS = 150;
const PER_MINUTE_CENTS = 25;
const SERVICE_FEE_CENTS = 100;

export interface FareInput {
  distanceMiles: number;
  durationMinutes: number;
}

export interface FareBreakdown {
  baseCents: number;
  distanceCents: number;
  timeCents: number;
  serviceFeeCents: number;
  totalCents: number;
}

export function calculateFare(input: FareInput): FareBreakdown {
  const distanceCents = Math.round(input.distanceMiles * PER_MILE_CENTS);
  const timeCents = Math.round(input.durationMinutes * PER_MINUTE_CENTS);

  return {
    baseCents: BASE_FARE_CENTS,
    distanceCents,
    timeCents,
    serviceFeeCents: SERVICE_FEE_CENTS,
    totalCents: BASE_FARE_CENTS + distanceCents + timeCents + SERVICE_FEE_CENTS,
  };
}
