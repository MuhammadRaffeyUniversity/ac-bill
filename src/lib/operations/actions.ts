"use server";

import { revalidatePath } from "next/cache";

import { JobStatus, PaymentStatus } from "@/src/generated/prisma/enums";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";
import { assignJobSchema, closeoutJobSchema, createTeamExpenseSchema } from "@/src/lib/operations/schemas";

export type OperationActionState = { error?: string; success?: string };
export const initialOperationActionState: OperationActionState = {};

export async function assignJob(
  _previousState: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  const session = await requireRole(["DATA_ENTRY", "DISPATCHER"]);
  const result = assignJobSchema.safeParse({ jobId: formData.get("jobId"), teamId: formData.get("teamId"), note: formData.get("note") });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Check the assignment details." };

  const [job, team] = await Promise.all([
    db.job.findUnique({ where: { id: result.data.jobId }, select: { id: true, status: true } }),
    db.team.findFirst({ where: { id: result.data.teamId, active: true }, select: { id: true } }),
  ]);
  if (!job) return { error: "This job no longer exists. Refresh the queue." };
  if (!team) return { error: "This team is not active. Refresh and choose another team." };
  if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) return { error: "Closed jobs cannot be assigned." };

  await db.job.update({
    where: { id: job.id },
    data: {
      assignedTeamId: team.id,
      status: job.status === JobStatus.BOOKED ? JobStatus.ASSIGNED : job.status,
      statusHistory: { create: { previousStatus: job.status, nextStatus: job.status === JobStatus.BOOKED ? JobStatus.ASSIGNED : job.status, actorId: session.user.id, note: result.data.note || "Assigned by data entry." } },
    },
  });
  revalidatePath("/dispatch");
  revalidatePath("/jobs");
  return { success: "Job assigned and recorded in its status history." };
}

export async function closeoutJob(
  _previousState: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  const session = await requireRole(["DATA_ENTRY", "DISPATCHER"]);
  const result = closeoutJobSchema.safeParse({ jobId: formData.get("jobId"), performed: formData.get("performed"), status: formData.get("status"), paymentStatus: formData.get("paymentStatus"), note: formData.get("note") });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Check the closeout details." };
  const data = result.data;
  if (data.status === "COMPLETED" && data.performed !== "YES") return { error: "A job can only be completed after confirming that the work was performed." };
  if (data.status === "CANCELLED" && data.paymentStatus !== "CANCELLED") return { error: "Cancelled jobs must use the cancelled payment outcome." };

  const job = await db.job.findUnique({ where: { id: data.jobId }, select: { id: true, status: true } });
  if (!job) return { error: "This job no longer exists. Refresh the jobs list." };

  await db.job.update({
    where: { id: job.id },
    data: {
      status: data.status as JobStatus,
      paymentStatus: data.paymentStatus as PaymentStatus,
      performed: data.performed === "YES",
      performedAt: data.performed === "YES" ? new Date() : null,
      cancellationReason: data.status === "CANCELLED" ? data.note : null,
      remarks: data.note,
      statusHistory: { create: { previousStatus: job.status, nextStatus: data.status as JobStatus, actorId: session.user.id, note: data.note } },
    },
  });
  revalidatePath("/jobs");
  revalidatePath("/dispatch");
  revalidatePath("/team-entries");
  return { success: "Closeout and payment outcome recorded." };
}

export async function createTeamExpense(
  _previousState: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  await requireRole(["DATA_ENTRY"]);
  const result = createTeamExpenseSchema.safeParse({ teamId: formData.get("teamId"), jobId: formData.get("jobId"), date: formData.get("date"), category: formData.get("category"), description: formData.get("description"), amount: formData.get("amount"), paidBy: formData.get("paidBy") });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Check the expense details." };
  const data = result.data;
  const jobId = data.jobId || undefined;
  const [team, job] = await Promise.all([
    db.team.findFirst({ where: { id: data.teamId, active: true }, select: { id: true } }),
    jobId ? db.job.findUnique({ where: { id: jobId }, select: { id: true, assignedTeamId: true } }) : Promise.resolve(null),
  ]);
  if (!team) return { error: "This team is not active. Refresh and choose another team." };
  if (jobId && !job) return { error: "The selected job no longer exists." };
  if (job?.assignedTeamId && job.assignedTeamId !== data.teamId) return { error: "The selected job belongs to another team." };

  await db.teamExpense.create({ data: { teamId: team.id, jobId, date: data.date, category: data.category, description: data.description || undefined, amount: data.amount, paidBy: data.paidBy } });
  revalidatePath("/expenses");
  return { success: "Team expense saved as pending approval." };
}
