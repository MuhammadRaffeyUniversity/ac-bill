import { z } from "zod";

export const recordFullPayoutSchema = z.object({
  obligationId: z.string().trim().min(1),
  method: z.enum(["CASH", "ONLINE", "CARD", "OTHER"]),
  paidAt: z.iso.date(),
  referenceNumber: z.string().trim().max(200).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});
