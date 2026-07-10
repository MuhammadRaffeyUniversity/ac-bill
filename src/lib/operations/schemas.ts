import { z } from "zod";

export const assignJobSchema = z.object({
  jobId: z.string().trim().min(1),
  teamId: z.string().trim().min(1, "Choose an active team."),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const closeoutJobSchema = z.object({
  jobId: z.string().trim().min(1),
  performed: z.enum(["YES", "NO"]),
  status: z.enum(["COMPLETED", "CANCELLED", "POSTPONED"]),
  paymentStatus: z.enum(["PAID", "PARTIALLY_PAID", "UNPAID", "NO_CHARGE", "CANCELLED"]),
  note: z.string().trim().min(1, "Add a closeout note for the audit trail.").max(2_000),
});

export const createTeamExpenseSchema = z.object({
  teamId: z.string().trim().min(1, "Choose the team that incurred this expense."),
  jobId: z.string().trim().optional().or(z.literal("")),
  date: z.coerce.date(),
  category: z.string().trim().min(1, "Choose or enter an expense category.").max(100),
  description: z.string().trim().max(1_000).optional().or(z.literal("")),
  amount: z.coerce.number().positive("Enter an amount greater than zero.").max(1_000_000),
  paidBy: z.enum(["TEAM", "MEMBER", "COMPANY", "PARTNER", "OWNER"]),
});
