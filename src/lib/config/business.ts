export const businessSetup = {
  activeTeams: 6,
  salaryTeams: 5,
  commissionTeams: 1,
  senderCommissionRate: 0.25,
  commissionTeamRates: {
    teamRate: 0.6,
    partnerRate: 0.25,
    companyRate: 0.15,
  },
} as const;

export const navigationItems = [
  "Dashboard",
  "Intake",
  "Dispatch",
  "Jobs",
  "Finance",
  "Expenses",
] as const;

export const teamWorkloadRows = [
  {
    label: "Salary team 1",
    region: "Johor Bahru",
    activeJobs: 4,
    completedJobs: 6,
    cashHeld: 820,
    sentOnline: 560,
    expenses: 95,
  },
  {
    label: "Salary team 2",
    region: "Pasir Gudang",
    activeJobs: 3,
    completedJobs: 5,
    cashHeld: 420,
    sentOnline: 700,
    expenses: 115,
  },
  {
    label: "Commission team",
    region: "Melaka",
    activeJobs: 2,
    completedJobs: 3,
    cashHeld: 260,
    sentOnline: 300,
    expenses: 0,
  },
] as const;
