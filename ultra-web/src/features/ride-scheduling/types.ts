export interface ScheduledRide {
  id: string;
  pickup: import("@/types").Location;
  dropoff: import("@/types").Location;
  date: string;
  time: string;
  isRecurring: boolean;
  recurringDays?: number[]; // 0=Sun, 1=Mon, ... 6=Sat
  riderProfileId?: string;
  endDate?: string;
  estimatedFare: number;
}

export interface RiderProfile {
  id: string;
  name: string;
  age: number;
  emergencyContact: string;
}
