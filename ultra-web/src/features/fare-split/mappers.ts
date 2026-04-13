import type { FareSplit } from "./types";

interface FareSplitRow {
  id: string;
  ride_id: string;
  inviter_id: string;
  invitee_id: string;
  inviter_amount: number;
  invitee_amount: number;
  status: string;
  responded_at: string | null;
  expires_at: string;
}

interface RiderInfo {
  id: string;
  name: string;
}

export function mapFareSplitRowToFareSplit(
  row: FareSplitRow,
  inviterInfo: RiderInfo,
  inviteeInfo: RiderInfo,
): FareSplit {
  const total = Number(row.inviter_amount) + Number(row.invitee_amount);

  return {
    id: row.id,
    originalFare: total,
    perPersonFare: total / 2,
    savings: total / 2,
    riders: [
      {
        user: { id: inviterInfo.id, name: inviterInfo.name, email: "", phone: "" },
        status: "accepted",
        fare: Number(row.inviter_amount),
        paymentMethod: { type: "visa", last4: "0000" },
      },
      {
        user: { id: inviteeInfo.id, name: inviteeInfo.name, email: "", phone: "" },
        status: row.status as "pending" | "accepted" | "declined",
        fare: Number(row.invitee_amount),
        paymentMethod: { type: "visa", last4: "0000" },
      },
    ],
  };
}
