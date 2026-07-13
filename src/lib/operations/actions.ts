"use server";

import { revalidatePath } from "next/cache";

import { JobStatus } from "@/src/generated/prisma/enums";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";
import { assignJobSchema, createTeamExpenseSchema } from "@/src/lib/operations/schemas";

export type OperationActionState = { error?: string; success?: string; resetKey?: string; invoiceJobId?: string; jobId?: string };

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
  return { success: "Job assigned and recorded in its status history.", resetKey: `${job.id}:${Date.now()}`, jobId: job.id };
}

export async function closeoutJob(
  _previousState: OperationActionState,
  _formData: FormData,
): Promise<OperationActionState> {
  void _previousState;
  void _formData;
  await requireRole(["DATA_ENTRY", "DISPATCHER"]);
  return { error: "Use the guided job flow to close this job with its original team report and payment details." };
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
