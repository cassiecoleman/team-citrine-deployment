import { mockDelay } from "@/lib/mock-delay";
import type {
  TrustedDriver,
  EmergencyContact,
  TripSharingSettings,
  NotificationPreferences,
} from "./types";

export async function getTrustedDrivers(): Promise<TrustedDriver[]> {
  await mockDelay();
  return [
    {
      id: "td-1",
      name: "Maria S.",
      rating: 4.9,
      totalRides: 142,
      verified: true,
    },
    {
      id: "td-2",
      name: "Carlos R.",
      rating: 4.7,
      totalRides: 87,
      verified: true,
    },
  ];
}

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  await mockDelay();
  return [
    {
      id: "ec-1",
      name: "Rosa M.",
      relationship: "Mom",
      phone: "+1 (555) 987-6543",
      autoShare: true,
    },
    {
      id: "ec-2",
      name: "David M.",
      relationship: "Uncle",
      phone: "+1 (555) 876-5432",
      autoShare: false,
    },
  ];
}

export async function getTripSharingSettings(): Promise<TripSharingSettings> {
  await mockDelay();
  return {
    autoShareChildRides: true,
    includeLiveMapLink: true,
    notifyOnArrival: true,
  };
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  await mockDelay();
  return {
    phone: "+1 (555) 123-4567",
    smsRideConfirmed: true,
    smsDriverArrives: true,
    smsTripEnds: true,
    smsTripCancelled: true,
    pushNotifications: false,
    ridePassReminders: true,
  };
}
