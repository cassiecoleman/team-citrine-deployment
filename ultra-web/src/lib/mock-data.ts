import type {
  Location,
  User,
  Contact,
  RidePassPlan,
  ActiveRidePass,
  SpendingData,
  FareEstimate,
  FareSplit,
  PaymentMethod,
  Driver,
  RideReceipt,
  Ride,
} from "@/types";

// --- Locations ---

export const homeLocation: Location = {
  lat: 35.1201,
  lng: -89.9397,
  address: "720 Alumni Ave",
};

export const officeLocation: Location = {
  lat: 35.1132,
  lng: -89.8929,
  address: "i-Bank Tower",
};

export const hospitalLocation: Location = {
  lat: 40.7489,
  lng: -73.968,
  address: "Metro General Hospital",
};

// --- Users ---

export const currentUser: User = {
  id: "u1",
  name: "Aisha R.",
  email: "aisha@example.com",
  phone: "555-0101",
};

export const jamesUser: User = {
  id: "u2",
  name: "James K.",
  email: "james@example.com",
  phone: "555-0102",
};

export const kenjiUser: User = {
  id: "u3",
  name: "Kenji T.",
  email: "kenji@example.com",
  phone: "555-0103",
};

// --- Contacts ---

export const mockContacts: Contact[] = [
  { id: "c1", user: kenjiUser, isNearRoute: true },
  {
    id: "c2",
    user: { id: "u4", name: "Priya M.", email: "priya@example.com", phone: "555-0104" },
    isNearRoute: false,
  },
  {
    id: "c3",
    user: { id: "u5", name: "David L.", email: "david@example.com", phone: "555-0105" },
    isNearRoute: false,
  },
];

// --- Payment ---

export const aishaPayment: PaymentMethod = { type: "visa", last4: "4821" };
export const kenjiPayment: PaymentMethod = { type: "visa", last4: "7733" };

// --- Ride Pass Plans ---

export const mockPassPlans: RidePassPlan[] = [
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

export const mockSpendingData: SpendingData = {
  avgWeeklySpend: 100,
  topRoute: { from: "Home", to: "Office", distanceMi: 4.2 },
};

export const mockActivePass: ActiveRidePass = {
  id: "pass-1",
  plan: mockPassPlans[0],
  status: "active",
  purchaseDate: "2026-03-23",
  renewsOn: "2026-03-30",
  usedRides: 0,
  route: { from: homeLocation, to: officeLocation },
};

// --- Fare Estimate ---

export const mockFareEstimate: FareEstimate = {
  totalFare: 19.0,
  durationMin: 18,
  distanceMi: 5.1,
};

// --- Fare Split ---

export const mockFareSplit: FareSplit = {
  id: "split-1",
  originalFare: 19.0,
  perPersonFare: 9.5,
  savings: 9.5,
  riders: [
    { user: currentUser, status: "accepted", fare: 9.5, paymentMethod: aishaPayment },
    { user: kenjiUser, status: "accepted", fare: 9.5, paymentMethod: kenjiPayment },
  ],
};

// --- Driver ---

export const mockDriver: Driver = {
  id: "d1",
  name: "Marcus W.",
  rating: 4.9,
  vehicle: "Toyota Camry",
  licensePlate: "ULT-2026",
  etaMinutes: 8,
};

// --- Receipt ---

export const mockReceipt: RideReceipt = {
  ride: {
    id: "ride-1",
    pickup: homeLocation,
    dropoff: hospitalLocation,
    status: "completed",
    estimatedFare: 19.0,
    actualFare: 19.0,
    driver: mockDriver,
  },
  totalFare: 19.0,
  riders: [
    { user: currentUser, charge: 9.5, paymentMethod: aishaPayment },
    { user: kenjiUser, charge: 9.5, paymentMethod: kenjiPayment },
  ],
  savings: 9.5,
  weeklySavingsProjection: 47.5,
  rideTime: { start: "7:01 AM", end: "7:19 AM" },
};
