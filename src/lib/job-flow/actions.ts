"use server";

import { revalidatePath } from "next/cache";

import { JobStatus, PaymentStatus, ReviewStatus, TeamEntryType } from "@/src/generated/prisma/enums";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";
import { teamReportCloseoutSchema } from "@/src/lib/job-flow/schema";

export type JobFlowActionState = { error?: string; success?: string; jobId?: string };

export async function saveTeamReportAndCloseout(
  _previousState: JobFlowActionState,
  formData: FormData,
): Promise<JobFlowActionState> {
  const session = await requireRole(["DATA_ENTRY"]);

  let payments: unknown;
  try {
    payments = JSON.parse(String(formData.get("payments") ?? "[]"));
  } catch {
    return { error: "Payment rows could not be read. Add them again." };
  }

  const result = teamReportCloseoutSchema.safeParse({
    jobId: formData.get("jobId"),
    expectedUpdatedAt: formData.get("expectedUpdatedAt"),
    rawWhatsAppText: formData.get("rawWhatsAppText"),
    submittedByMemberId: formData.get("submittedByMemberId"),
    entryDate: formData.get("entryDate"),
    performed: formData.get("performed"),
    status: formData.get("status"),
    paymentStatus: formData.get("paymentStatus"),
    completedAmount: formData.get("completedAmount"),
    payments,
    note: formData.get("note"),
  });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Check the team report details." };

  const data = result.data;
  const job = await db.job.findUnique({
    where: { id: data.jobId },
    select: { id: true, assignedTeamId: true, status: true, updatedAt: true },
  });
  if (!job) return { error: "This job no longer exists. Refresh the queue." };
  if (!job.assignedTeamId) return { error: "Assign an active team before recording its report." };
  if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) return { error: "This job is already closed." };
  if (job.updatedAt.toISOString() !== data.expectedUpdatedAt) return { error: "This job changed since you opened it. Refresh it before saving." };

  const memberId = data.submittedByMemberId || undefined;
  if (memberId) {
    const member = await db.teamMember.findFirst({
      where: { id: memberId, teamId: job.assignedTeamId, active: true },
      select: { id: true },
    });
    if (!member) return { error: "That team member is not active for the assigned team." };
  }

  try {
    await db.$transaction(async (tx) => {
      const current = await tx.job.findUnique({ where: { id: job.id }, select: { status: true, updatedAt: true } });
      if (!current || current.updatedAt.valueOf() !== job.updatedAt.valueOf()) throw new Error("STALE_JOB");

      await tx.teamSubmittedEntry.create({
        data: {
          teamId: job.assignedTeamId!,
          submittedByMemberId: memberId,
          enteredByOperatorId: session.user.id,
          jobId: job.id,
          rawWhatsAppText: data.rawWhatsAppText,
          entryType: TeamEntryType.COMPLETION,
          parsedFields: {
            source: "MANUAL_DATA_ENTRY",
            completedAmount: data.completedAmount,
            paymentStatus: data.paymentStatus,
            payments: data.payments,
            performed: data.performed,
            status: data.status,
          },
          entryDate: data.entryDate,
          reviewStatus: ReviewStatus.APPROVED,
          notes: data.note,
        },
      });

      await tx.job.update({
        where: { id: job.id },
        data: {
          status: data.status as JobStatus,
          paymentStatus: data.paymentStatus as PaymentStatus,
          performed: data.performed === "YES",
          performedAt: data.performed === "YES" ? new Date() : null,
          cancellationReason: data.status === "CANCELLED" ? data.note : null,
          remarks: data.note,
          statusHistory: {
            create: {
              previousStatus: current.status,
              nextStatus: data.status as JobStatus,
              actorId: session.user.id,
              note: data.note,
            },
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "STALE_JOB") return { error: "This job changed since you opened it. Refresh it before saving." };
    throw error;
  }

  revalidatePath("/jobs");
  return { success: data.status === "COMPLETED" ? "Team report confirmed. Continue to invoice." : "Team report and closeout saved.", jobId: job.id };
}
