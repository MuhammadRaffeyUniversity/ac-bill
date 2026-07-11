import type { CompensationType } from "@/src/generated/prisma/enums";

type InitialTeam = {
  name: string;
  region: string | null;
  serviceAreaTags: readonly string[];
  compensationType: CompensationType;
  members: readonly string[];
};

type InitialCommissionRule = {
  seedKey: string;
  compensationType: CompensationType;
  teamRate: number;
  partnerRate: number;
  companyRate: number;
};

export const initialTeamRoster = [
  {
    name: "JB Team 1",
    region: "Johor Bahru",
    serviceAreaTags: ["Johor Bahru"],
    compensationType: "SALARY",
    members: ["Nouman", "Khan"],
  },
  {
    name: "JB Team 2",
    region: "Johor Bahru",
    serviceAreaTags: ["Johor Bahru"],
    compensationType: "SALARY",
    members: ["Ayaz Khan", "Yousaf Khan"],
  },
  {
    name: "Melaka Team 1",
    region: "Melaka",
    serviceAreaTags: ["Melaka"],
    compensationType: "SALARY",
    members: ["Zubair", "Rehman"],
  },
  {
    name: "Ali & Zeeshan",
    region: null,
    serviceAreaTags: [],
    compensationType: "COMMISSION",
    members: ["Ali", "Zeeshan"],
  },
] as const satisfies readonly InitialTeam[];

export const initialCommissionRules = [
  {
    seedKey: "initial-global-salary",
    compensationType: "SALARY",
    teamRate: 0,
    partnerRate: 0.25,
    companyRate: 0,
  },
  {
    seedKey: "initial-global-commission",
    compensationType: "COMMISSION",
    teamRate: 0.6,
    partnerRate: 0.25,
    companyRate: 0.15,
  },
] as const satisfies readonly InitialCommissionRule[];
