import type { AdminDriver, AdminRequest, AdminRide, AdminCompletedRide } from "./types";

export const adminDrivers: AdminDriver[] = [
  { id: "D-001", name: "Maria Lopez", status: "Active", rating: 4.9, vehicle: "Toyota Camry", lastActive: "5m ago" },
  { id: "D-002", name: "Jonah Reid", status: "Offline", rating: 4.7, vehicle: "Honda Accord", lastActive: "42m ago" },
  { id: "D-003", name: "Preeti Sharma", status: "Active", rating: 4.8, vehicle: "Kia Rio", lastActive: "2m ago" },
];

export const adminRequests: AdminRequest[] = [
  { id: "R-4401", pickup: "1401 Taylor St", dropoff: "Ward High", requestedAt: "08:03", zone: "West" },
  { id: "R-4410", pickup: "2000 Lake Ave", dropoff: "Downtown Plaza", requestedAt: "08:08", zone: "Central" },
  { id: "R-4412", pickup: "111 Market St", dropoff: "Court Square", requestedAt: "08:20", zone: "East" },
];

export const adminRides: AdminRide[] = [
  { id: "T-9201", rider: "June Park", driver: "Maria Lopez", status: "En Route", eta: "7m" },
  { id: "T-9205", rider: "Carlos Vega", driver: "Preeti Sharma", status: "In Progress", eta: "12m" },
  { id: "T-9208", rider: "Amina Rose", driver: "Jonah Reid", status: "Assigned", eta: "3m" },
];

export const adminCompletedRides: AdminCompletedRide[] = [
  { id: "C-7801", rider: "Maya Brooks", driver: "Jonah Reid", fare: "$13.30", completedAt: "2026-03-31T09:30:00Z" },
  { id: "C-7802", rider: "Derek Yuan", driver: "Maria Lopez", fare: "$18.75", completedAt: "2026-03-30T09:34:00Z" },
  { id: "C-7803", rider: "Elena Kim", driver: "Preeti Sharma", fare: "$22.15", completedAt: "2026-03-29T16:20:00Z" },
];
