import { z } from "zod";

export const createFareSplitSchema = z.object({
  rideId: z.string().uuid(),
  inviteeId: z.string().uuid(),
  totalFare: z.number().positive(),
});

export const fareSplitIdSchema = z.object({
  splitId: z.string().uuid(),
});

export const rideIdSchema = z.object({
  rideId: z.string().uuid(),
});
