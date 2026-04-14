import { z } from "zod";

export const purchasePassSchema = z.object({
  planId: z.string().min(1),
});

export const passIdSchema = z.object({
  passId: z.string().uuid(),
});

export const cancelPassSchema = z.object({
  passId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});
