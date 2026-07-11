import { z } from "zod";

const amount = z.coerce.number().finite().positive("Enter an amount greater than zero.").max(1_000_000);
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const companyExpenseSchema = z.object({
  date: z.coerce.date(),
  category: z.string().trim().min(1, "Enter an expense category.").max(100),
  amount,
  paymentMethod: z.enum(["CASH", "ONLINE", "CARD", "OTHER"]).optional().or(z.literal("")),
  description: optionalText(1_000),
  notes: optionalText(2_000),
});

export const personalExpenseSchema = z.object({
  date: z.coerce.date(),
  category: optionalText(100),
  amount,
  description: optionalText(1_000),
  notes: optionalText(2_000),
});

export const pettyCashEntrySchema = z.object({
  date: z.coerce.date(),
  direction: z.enum(["IN", "OUT"]),
  amount,
  sourceType: optionalText(100),
  note: optionalText(2_000),
});
