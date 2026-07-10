"use server";

import { revalidatePath } from "next/cache";
import { CompensationType } from "@/src/generated/prisma/enums";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";
import { createTeamSchema, parseServiceAreaTags } from "@/src/lib/team-setup/schema";

export type TeamSetupActionState = { error?: string; success?: string };

export const initialTeamSetupActionState: TeamSetupActionState = {};

const teamLimits = {
  SALARY: 5,
  COMMISSION: 1,
} as const;

export async function createTeam(
  _previousState: TeamSetupActionState,
  formData: FormData,
): Promise<TeamSetupActionState> {
  await requireRole(["DATA_ENTRY"]);

  const result = createTeamSchema.safeParse({
    name: formData.get("name"),
    region: formData.get("region"),
    compensationType: formData.get("compensationType"),
    serviceAreaTags: formData.get("serviceAreaTags"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Check the team details and try again." };
  }

  const data = result.data;
  const activeCount = await db.team.count({
    where: { active: true, compensationType: data.compensationType as CompensationType },
  });
  const limit = teamLimits[data.compensationType];

  if (activeCount >= limit) {
    return { error: `The active ${data.compensationType.toLowerCase()} team limit (${limit}) has already been reached.` };
  }

  await db.team.create({
    data: {
      name: data.name,
      region: data.region || undefined,
      compensationType: data.compensationType as CompensationType,
      serviceAreaTags: parseServiceAreaTags(data.serviceAreaTags || ""),
    },
  });

  revalidatePath("/team-setup");
  revalidatePath("/dispatch");
  revalidatePath("/team-entries");
  return { success: `${data.name} is ready for dispatch and team entries.` };
}
