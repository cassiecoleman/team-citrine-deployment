export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}

export interface Contact {
  id: string;
  user: User;
  isNearRoute: boolean;
}

export type PassTier = "weekly-5" | "weekly-10";

export interface RidePassPlan {
  id: string;
  tier: PassTier;
  ridesPerWeek: number;
  pricePerWeek: number;
  pricePerRide: number;
  savingsPerWeek: number;
  recommended: boolean;
}

export interface ActiveRidePass {
  id: string;
  plan: RidePassPlan;
  status: "active" | "cancelled" | "expired";
  purchaseDate: string;
  renewsOn: string;
  usedRides: number;
  route: { from: Location; to: Location };
}

export interface SpendingData {
  avgWeeklySpend: number;
  topRoute: { from: string; to: string; distanceMi: number };
}

export interface FareEstimate {
  totalFare: number;
  durationMin: number;
  distanceMi: number;
}

export interface FareSplit {
  id: string;
  originalFare: number;
  perPersonFare: number;
  savings: number;
  riders: SplitRider[];
}

export interface SplitRider {
  user: User;
  status: "pending" | "accepted" | "declined";
  fare: number;
  paymentMethod: PaymentMethod;
}

export interface PaymentMethod {
  type: "visa" | "mastercard";
  last4: string;
}

export type RideStatus = "matching" | "accepted" | "in_transit" | "completed";

export interface Ride {
  id: string;
  pickup: Location;
  dropoff: Location;
  status: RideStatus;
  estimatedFare: number;
  actualFare?: number;
  driver?: Driver;
  split?: FareSplit;
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  vehicle: string;
  licensePlate: string;
  etaMinutes: number;
}

export interface RideReceipt {
  ride: Ride;
  totalFare: number;
  riders: { user: User; charge: number; paymentMethod: PaymentMethod }[];
  savings: number;
  weeklySavingsProjection: number;
  rideTime: { start: string; end: string };
}
