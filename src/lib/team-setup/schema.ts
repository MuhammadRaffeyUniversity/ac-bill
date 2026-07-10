import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, "Enter the team's name.").max(100),
  region: z.string().trim().max(100).optional().or(z.literal("")),
  compensationType: z.enum(["SALARY", "COMMISSION"]),
  serviceAreaTags: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export function parseServiceAreaTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);
}
