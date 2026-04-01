export interface TrustedDriver {
  id: string;
  name: string;
  rating: number;
  totalRides: number;
  verified: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  autoShare: boolean;
}

export interface TripSharingSettings {
  autoShareChildRides: boolean;
  includeLiveMapLink: boolean;
  notifyOnArrival: boolean;
}

export interface NotificationPreferences {
  phone: string;
  smsRideConfirmed: boolean;
  smsDriverArrives: boolean;
  smsTripEnds: boolean;
  smsTripCancelled: boolean;
  pushNotifications: boolean;
  ridePassReminders: boolean;
}
