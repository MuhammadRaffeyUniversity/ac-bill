import { describe, expect, it } from "vitest";

import { buildCommissionRecords, commissionSourceKey } from "./commission-obligations";

describe("commission obligations", () => {
  it("builds the invoice allocation and two member obligations", () => {
    expect(commissionSourceKey("invoice", "ali")).toBe("commission:invoice:ali");
    expect(buildCommissionRecords({
      invoiceId: "invoice",
      jobId: "job",
      teamId: "team",
      partnerId: "partner",
      compensationType: "COMMISSION",
      subtotal: 600,
      discount: 40,
      members: [{ id: "ali" }, { id: "zeeshan" }],
      rates: { teamRate: 0.6, partnerRate: 0.25, companyRate: 0.15 },
      earnedAt: new Date("2026-07-17T00:00:00Z"),
    })).toMatchObject({
      commissionEntry: {
        salesAmount: 560,
        teamAmount: 336,
        partnerAmount: 140,
        companyAmount: 84,
        netCompanyProfit: 84,
      },
      obligations: [
        { teamMemberId: "ali", amount: 168 },
        { teamMemberId: "zeeshan", amount: 168 },
      ],
    });
  });

  it("records sender and company shares without team obligations for salary teams", () => {
    expect(buildCommissionRecords({
      invoiceId: "invoice",
      jobId: "job",
      teamId: "team",
      partnerId: "partner",
      compensationType: "SALARY",
      subtotal: 510,
      discount: 0,
      members: [{ id: "a" }, { id: "b" }],
      rates: { teamRate: 0, partnerRate: 0.25, companyRate: 0 },
      earnedAt: new Date("2026-07-17T00:00:00Z"),
    })).toMatchObject({
      commissionEntry: {
        salesAmount: 510,
        teamAmount: 0,
        partnerAmount: 127.5,
        companyAmount: 382.5,
        netCompanyProfit: 382.5,
      },
      obligations: [],
    });
  });
});
