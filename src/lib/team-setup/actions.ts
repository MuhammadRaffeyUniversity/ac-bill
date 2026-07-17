"use server";

import { revalidatePath } from "next/cache";
import { CompensationType } from "@/src/generated/prisma/enums";
import { requireRole } from "@/src/lib/auth/guards";
import { businessSetup } from "@/src/lib/config/business";
import { db } from "@/src/lib/db";
import { createTeamSchema, parseServiceAreaTags } from "@/src/lib/team-setup/schema";

export type TeamSetupActionState = { error?: string; success?: string };

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
    memberOneName: formData.get("memberOneName"),
    memberTwoName: formData.get("memberTwoName"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Check the team details and try again." };
  }

  const data = result.data;

  await db.$transaction(async (tx) => {
    await tx.team.create({
      data: {
        name: data.name,
        region: data.region || undefined,
        compensationType: data.compensationType as CompensationType,
        monthlySalaryAmount: data.compensationType === CompensationType.SALARY
          ? businessSetup.salaryTeamMonthlyAmount
          : null,
        defaultMembers: [data.memberOneName, data.memberTwoName],
        serviceAreaTags: parseServiceAreaTags(data.serviceAreaTags || ""),
        members: {
          create: [
            { name: data.memberOneName, active: true },
            { name: data.memberTwoName, active: true },
          ],
        },
      },
    });
  });

  revalidatePath("/team-setup");
  revalidatePath("/dispatch");
  revalidatePath("/team-entries");
  return { success: `${data.name} is ready for dispatch and team entries.` };
}
