"use server";

import { revalidatePath } from "next/cache";

import { ReviewStatus } from "@/src/generated/prisma/enums";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";
import { createTeamEntrySchema, reviewTeamEntrySchema } from "@/src/lib/team-entries/schema";

export type TeamEntryActionState = {
  error?: string;
  success?: string;
};

const initialActionState: TeamEntryActionState = {};

export { initialActionState };

export async function createTeamEntry(
  _previousState: TeamEntryActionState,
  formData: FormData,
): Promise<TeamEntryActionState> {
  const session = await requireRole(["DATA_ENTRY"]);
  const result = createTeamEntrySchema.safeParse({
    rawWhatsAppText: formData.get("rawWhatsAppText"),
    entryType: formData.get("entryType"),
    teamId: formData.get("teamId"),
    submittedByMemberId: formData.get("submittedByMemberId"),
    jobId: formData.get("jobId"),
    entryDate: formData.get("entryDate"),
    notes: formData.get("notes"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Check the update details and try again." };
  }

  const data = result.data;
  const jobId = data.jobId || undefined;
  const memberId = data.submittedByMemberId || undefined;

  const [team, job, member] = await Promise.all([
    db.team.findFirst({ where: { id: data.teamId, active: true }, select: { id: true } }),
    jobId
      ? db.job.findUnique({ where: { id: jobId }, select: { id: true, assignedTeamId: true } })
      : Promise.resolve(null),
    memberId
      ? db.teamMember.findFirst({ where: { id: memberId, teamId: data.teamId, active: true }, select: { id: true } })
      : Promise.resolve(null),
  ]);

  if (!team) return { error: "That team is no longer active. Refresh and choose an active team." };
  if (jobId && !job) return { error: "That job no longer exists. Refresh and select another job." };
  if (job?.assignedTeamId && job.assignedTeamId !== data.teamId) {
    return { error: "The selected job belongs to a different team. Choose its assigned team before saving." };
  }
  if (memberId && !member) return { error: "That team member is not active for the selected team." };

  await db.teamSubmittedEntry.create({
    data: {
      teamId: data.teamId,
      submittedByMemberId: memberId,
      enteredByOperatorId: session.user.id,
      jobId,
      rawWhatsAppText: data.rawWhatsAppText,
      entryType: data.entryType,
      entryDate: data.entryDate,
      notes: data.notes || undefined,
    },
  });

  revalidatePath("/team-entries");
  return { success: "Update saved for review." };
}

export async function reviewTeamEntry(formData: FormData) {
  await requireRole(["DATA_ENTRY"]);
  const result = reviewTeamEntrySchema.safeParse({
    entryId: formData.get("entryId"),
    reviewStatus: formData.get("reviewStatus"),
  });

  if (!result.success) throw new Error("The review request is invalid.");

  await db.teamSubmittedEntry.update({
    where: { id: result.data.entryId },
    data: { reviewStatus: result.data.reviewStatus === "APPROVED" ? ReviewStatus.APPROVED : ReviewStatus.REJECTED },
  });
  revalidatePath("/team-entries");
}
