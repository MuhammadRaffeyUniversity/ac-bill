"use server";

import { Prisma } from "@/src/generated/prisma/client";
import { PayoutObligationStatus } from "@/src/generated/prisma/enums";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";
import { recordFullPayoutSchema } from "@/src/lib/payouts/schema";

export type PayoutActionState = { error?: string; success?: string };

export async function recordFullPayout(
  _previousState: PayoutActionState,
  formData: FormData,
): Promise<PayoutActionState> {
  const session = await requireRole(["DATA_ENTRY"]);
  const parsed = recordFullPayoutSchema.safeParse({
    obligationId: formData.get("obligationId"),
    method: formData.get("method"),
    paidAt: formData.get("paidAt"),
    referenceNumber: formData.get("referenceNumber") || "",
    note: formData.get("note") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the payout details." };
  }

  try {
    await db.$transaction(async (tx) => {
      const obligation = await tx.payoutObligation.findUnique({
        where: { id: parsed.data.obligationId },
        select: { id: true, status: true, amount: true },
      });
      if (!obligation) throw new Error("PAYOUT_NOT_FOUND");
      if (obligation.status !== PayoutObligationStatus.DUE) throw new Error("ALREADY_PAID");

      const payout = await tx.payout.create({
        data: {
          obligationId: obligation.id,
          amount: obligation.amount,
          method: parsed.data.method,
          referenceNumber: parsed.data.referenceNumber || null,
          note: parsed.data.note || null,
          paidAt: new Date(`${parsed.data.paidAt}T00:00:00+08:00`),
          recordedById: session.user.id,
        },
      });
      await tx.payoutObligation.update({
        where: { id: obligation.id },
        data: { status: PayoutObligationStatus.PAID },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          entityType: "PayoutObligation",
          entityId: obligation.id,
          action: "PAYOUT_RECORDED",
          before: { status: "DUE", amount: obligation.amount.toString() },
          after: { status: "PAID", payoutId: payout.id, amount: obligation.amount.toString() },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYOUT_NOT_FOUND") {
      return { error: "This payout obligation no longer exists." };
    }
    if (
      error instanceof Error && error.message === "ALREADY_PAID"
      || error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    ) {
      return { error: "This obligation is already paid. Refresh the payout list." };
    }
    throw error;
  }

  revalidatePath("/payouts");
  return { success: "Full payout recorded." };
}
