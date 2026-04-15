import type { AdminDriver, AdminRequest, AdminRide, AdminCompletedRide } from "./types";

export const adminDrivers: AdminDriver[] = [
  { id: "D-001", name: "Maria Lopez", status: "Active", rating: 4.9, lastActive: "5m ago" },
  { id: "D-002", name: "Jonah Reid", status: "Offline", rating: 4.7, lastActive: "42m ago" },
  { id: "D-003", name: "Preeti Sharma", status: "Active", rating: 4.8, lastActive: "2m ago" },
];

export const adminRequests: AdminRequest[] = [
  { requestId: "R-4401", riderName: "Maya Brooks", partnerName: "Jonah Reid", destination: "Ward High", status: "Pending" },
  { requestId: "R-4410", riderName: "Derek Yuan", partnerName: "Maria Lopez", destination: "Downtown Plaza", status: "Accepted" },
  { requestId: "R-4412", riderName: "Elena Kim", partnerName: "Preeti Sharma", destination: "Court Square", status: "Cancelled" },
];

export const adminRides: AdminRide[] = [
  {
    rideId: "T-9201",
    riderName: "June Park",
    driverName: "Maria Lopez",
    origin: "Community Clinic",
    status: "Driver En Route",
    startedAt: "2026-04-14T13:05:00.000Z",
    fare: 13.75,
  },
  {
    rideId: "T-9205",
    riderName: "Carlos Vega",
    driverName: "Preeti Sharma",
    origin: "Downtown Plaza",
    status: "In Progress",
    startedAt: "2026-04-14T12:42:00.000Z",
    fare: 22.4,
  },
  {
    rideId: "T-9208",
    riderName: "Amina Rose",
    driverName: "Jonah Reid",
    origin: "Ward High",
    status: "Arrived",
    startedAt: "2026-04-14T13:18:00.000Z",
    fare: 9.95,
  },
];

export const adminCompletedRides: AdminCompletedRide[] = [
  {
    rideId: "C-7801",
    riderName: "Maya Brooks",
    driverName: "Jonah Reid",
    distance: "5.2 mi",
    status: "Completed",
    completedAt: "2026-04-14T10:02:00.000Z",
    fare: 17.2,
  },
  {
    rideId: "C-7802",
    riderName: "Derek Yuan",
    driverName: "Maria Lopez",
    distance: "7.1 mi",
    status: "Completed",
    completedAt: "2026-04-14T11:30:00.000Z",
    fare: 24.1,
  },
  {
    rideId: "C-7803",
    riderName: "Elena Kim",
    driverName: "Preeti Sharma",
    distance: "3.8 mi",
    status: "Completed",
    completedAt: "2026-04-14T12:18:00.000Z",
    fare: 12.8,
  },
];
