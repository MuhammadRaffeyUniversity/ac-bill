"use server";

import { revalidatePath } from "next/cache";

import { PaymentMethod } from "@/src/generated/prisma/enums";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";
import { companyExpenseSchema, personalExpenseSchema, pettyCashEntrySchema } from "@/src/lib/ledger/schema";

export type LedgerActionState = { error?: string; success?: string };

async function requireDataEntry() {
  return requireRole(["DATA_ENTRY"]);
}

export async function createCompanyExpense(_previousState: LedgerActionState, formData: FormData): Promise<LedgerActionState> {
  await requireDataEntry();
  const result = companyExpenseSchema.safeParse({ date: formData.get("date"), category: formData.get("category"), amount: formData.get("amount"), paymentMethod: formData.get("paymentMethod"), description: formData.get("description"), notes: formData.get("notes") });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Check the company expense." };
  const data = result.data;
  await db.companyExpense.create({ data: { date: data.date, category: data.category, amount: data.amount, paymentMethod: data.paymentMethod ? data.paymentMethod as PaymentMethod : null, description: data.description || null, notes: data.notes || null } });
  revalidatePath("/ledger");
  revalidatePath("/");
  return { success: "Company expense recorded separately from team and personal spending." };
}

export async function createPersonalExpense(_previousState: LedgerActionState, formData: FormData): Promise<LedgerActionState> {
  await requireDataEntry();
  const result = personalExpenseSchema.safeParse({ date: formData.get("date"), category: formData.get("category"), amount: formData.get("amount"), description: formData.get("description"), notes: formData.get("notes") });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Check the personal expense." };
  const data = result.data;
  await db.personalExpense.create({ data: { date: data.date, category: data.category || null, amount: data.amount, description: data.description || null, notes: data.notes || null } });
  revalidatePath("/ledger");
  revalidatePath("/");
  return { success: "Personal expense recorded outside company profit." };
}

export async function createPettyCashEntry(_previousState: LedgerActionState, formData: FormData): Promise<LedgerActionState> {
  await requireDataEntry();
  const result = pettyCashEntrySchema.safeParse({ date: formData.get("date"), direction: formData.get("direction"), amount: formData.get("amount"), sourceType: formData.get("sourceType"), note: formData.get("note") });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Check the petty-cash entry." };
  const data = result.data;
  const lastEntry = await db.pettyCashEntry.findFirst({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], select: { date: true, balanceAfter: true } });
  if (lastEntry && data.date < lastEntry.date) return { error: "Back-dated petty-cash entries need reconciliation before they can be recorded." };
  const previousBalance = lastEntry ? Number(lastEntry.balanceAfter) : 0;
  const cashIn = data.direction === "IN" ? data.amount : 0;
  const cashOut = data.direction === "OUT" ? data.amount : 0;
  const balanceAfter = Math.round((previousBalance + cashIn - cashOut + Number.EPSILON) * 100) / 100;
  await db.pettyCashEntry.create({ data: { date: data.date, cashIn, cashOut, balanceAfter, sourceType: data.sourceType || null, note: data.note || null } });
  revalidatePath("/ledger");
  revalidatePath("/");
  return { success: `Petty-cash balance is now RM ${balanceAfter.toFixed(2)}.` };
}
