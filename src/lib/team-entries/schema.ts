import { z } from "zod";

export const teamEntryTypes = ["COMPLETION", "PAYMENT", "EXPENSE", "NOTE", "CORRECTION"] as const;

const optionalId = z.string().trim().min(1).optional().or(z.literal(""));
const optionalAmount = z.coerce.number().finite().min(0).max(1_000_000).optional().or(z.literal(""));

export const createTeamEntrySchema = z.object({
  rawWhatsAppText: z.string().trim().min(10, "Paste the complete WhatsApp update so the audit record is useful."),
  entryType: z.enum(teamEntryTypes),
  teamId: z.string().trim().min(1, "Choose the team that sent this update."),
  submittedByMemberId: optionalId,
  jobId: optionalId,
  entryDate: z.coerce.date(),
  notes: z.string().trim().max(2_000, "Notes must be 2,000 characters or fewer.").optional().or(z.literal("")),
  completedAmount: optionalAmount,
  paymentMethod: z.enum(["CASH", "ONLINE", "CARD", "OTHER"]).optional().or(z.literal("")),
}).superRefine((entry, context) => {
  if (entry.entryType !== "COMPLETION") return;
  if (!entry.jobId) context.addIssue({ code: "custom", path: ["jobId"], message: "Choose the completed job before saving this update." });
  if (entry.completedAmount === "" || entry.completedAmount === undefined) context.addIssue({ code: "custom", path: ["completedAmount"], message: "Enter the amount manually reported by the team." });
  if (!entry.paymentMethod) context.addIssue({ code: "custom", path: ["paymentMethod"], message: "Choose the manually reported payment method." });
});

export const reviewTeamEntrySchema = z.object({
  entryId: z.string().trim().min(1),
  reviewStatus: z.enum(["APPROVED", "REJECTED"]),
});

export type CreateTeamEntryInput = z.infer<typeof createTeamEntrySchema>;
