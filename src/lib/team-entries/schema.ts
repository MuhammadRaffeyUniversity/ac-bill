import { z } from "zod";

export const teamEntryTypes = ["COMPLETION", "PAYMENT", "EXPENSE", "NOTE", "CORRECTION"] as const;

const optionalId = z.string().trim().min(1).optional().or(z.literal(""));

export const createTeamEntrySchema = z.object({
  rawWhatsAppText: z.string().trim().min(10, "Paste the complete WhatsApp update so the audit record is useful."),
  entryType: z.enum(teamEntryTypes),
  teamId: z.string().trim().min(1, "Choose the team that sent this update."),
  submittedByMemberId: optionalId,
  jobId: optionalId,
  entryDate: z.coerce.date(),
  notes: z.string().trim().max(2_000, "Notes must be 2,000 characters or fewer.").optional().or(z.literal("")),
});

export const reviewTeamEntrySchema = z.object({
  entryId: z.string().trim().min(1),
  reviewStatus: z.enum(["APPROVED", "REJECTED"]),
});

export type CreateTeamEntryInput = z.infer<typeof createTeamEntrySchema>;
