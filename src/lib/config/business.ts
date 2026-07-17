export const businessSetup = {
  activeTeams: 6,
  salaryTeams: 5,
  commissionTeams: 1,
  salaryTeamMonthlyAmount: 2000,
  membersPerTeam: 2,
  senderCommissionRate: 0.25,
  commissionTeamRates: {
    teamRate: 0.6,
    partnerRate: 0.25,
    companyRate: 0.15,
  },
} as const;

export const invoiceProfile = {
  companyName: "EZY Aircon",
  tagline: "Your Air Cond Specialist",
  addressLines: ["Suite, 20-10 Cap Square Tower 10", "Jalan Munshi Abdullah 50100", "Kuala Lumpur, Malaysia"],
  phone: "+60 11-27051436",
  terms: [
    "Water leakage warranty is valid for 30 days from the service date.",
    "Warranty covers workmanship defects directly related to services performed by EZY Aircon.",
    "Warranty does not cover existing piping defects, electrical failures, misuse, power surges, or physical damage.",
    "Warranty becomes void if the unit is tampered with, repaired, or serviced by unauthorized personnel.",
    "Full payment is due upon completion of service unless otherwise agreed in writing.",
  ],
} as const;

export const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Intake", href: "/jobs/intake" },
  { label: "Dispatch", href: "/dispatch" },
  { label: "Jobs", href: "/jobs" },
  { label: "Finance", href: "/finance" },
  { label: "Expenses", href: "/expenses" },
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
