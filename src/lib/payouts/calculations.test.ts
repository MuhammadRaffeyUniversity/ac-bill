import { describe, expect, it } from "vitest";

import {
  allocateCommissionToMembers,
  allocateSalaryToMembers,
  calculateCommissionableSales,
  validateFullPayout,
} from "./calculations";

describe("team payouts", () => {
  it("splits RM 2,000 equally between two salary-team members", () => {
    expect(allocateSalaryToMembers({
      monthlyTeamSalary: 2000,
      memberIds: ["member-a", "member-b"],
    })).toEqual({
      total: 2000,
      members: [
        { memberId: "member-a", amount: 1000 },
        { memberId: "member-b", amount: 1000 },
      ],
    });
  });

  it("splits RM 560 into 30/30/25/15 commission shares", () => {
    expect(allocateCommissionToMembers({
      commissionableSales: 560,
      memberIds: ["ali", "zeeshan"],
      teamRate: 0.6,
      partnerRate: 0.25,
      companyRate: 0.15,
    })).toEqual({
      sales: 560,
      teamShare: 336,
      partnerShare: 140,
      companyShare: 84,
      members: [
        { memberId: "ali", amount: 168 },
        { memberId: "zeeshan", amount: 168 },
      ],
    });
  });

  it("gives an indivisible team-share cent to the first member", () => {
    expect(allocateCommissionToMembers({
      commissionableSales: 100.01,
      memberIds: ["first", "second"],
      teamRate: 0.6,
      partnerRate: 0.25,
      companyRate: 0.15,
    }).members).toEqual([
      { memberId: "first", amount: 30.01 },
      { memberId: "second", amount: 30 },
    ]);
  });

  it("uses subtotal after discount and excludes tax", () => {
    expect(calculateCommissionableSales({ subtotal: 600, discount: 40 })).toBe(560);
  });

  it("accepts only an exact full payout", () => {
    expect(validateFullPayout({ obligationAmount: 1000, payoutAmount: 1000 })).toBe(true);
    expect(validateFullPayout({ obligationAmount: 1000, payoutAmount: 500 })).toBe(false);
  });
});
