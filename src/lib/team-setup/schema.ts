import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, "Enter the team's name.").max(100),
  region: z.string().trim().max(100).optional().or(z.literal("")),
  compensationType: z.enum(["SALARY", "COMMISSION"]),
  serviceAreaTags: z.string().trim().max(500).optional().or(z.literal("")),
  memberOneName: z.string().trim().min(1, "Enter the first member.").max(100),
  memberTwoName: z.string().trim().min(1, "Enter the second member.").max(100),
}).refine(
  (data) => data.memberOneName.toLocaleLowerCase("en") !== data.memberTwoName.toLocaleLowerCase("en"),
  { path: ["memberTwoName"], message: "Team members must be different people." },
);

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export function canCreateTeam() {
  return true;
}

export function parseServiceAreaTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);
}
