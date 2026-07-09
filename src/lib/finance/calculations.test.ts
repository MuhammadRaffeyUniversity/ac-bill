import { describe, expect, test } from "vitest";

import {
  calculateCommissionTeamSplit,
  calculateInvoiceBalance,
  calculatePaymentReconciliation,
  calculateSalaryTeamProfit,
  canCloseJob,
} from "./calculations";

describe("finance calculations", () => {
  test("splits commission-team sales into 60% team, 25% sender, and 15% company shares", () => {
    expect(calculateCommissionTeamSplit({ sales: 560 })).toEqual({
      sales: 560,
      teamShare: 336,
      partnerShare: 140,
      companyShare: 84,
    });
  });

  test("calculates salary-team company profit after sender share and approved expenses", () => {
    expect(calculateSalaryTeamProfit({ sales: 510, approvedExpenses: 115 })).toEqual({
      sales: 510,
      senderShare: 127.5,
      approvedExpenses: 115,
      companyProfit: 267.5,
    });
  });

  test("calculates invoice balance from line totals and payments", () => {
    expect(
      calculateInvoiceBalance({
        invoiceItems: [120, 80, 50],
        payments: [100, 40],
      }),
    ).toEqual({
      invoiceTotal: 250,
      paidTotal: 140,
      balanceDue: 110,
    });
  });

  test("reconciles daily earnings against online received and deposited cash", () => {
    expect(
      calculatePaymentReconciliation({
        salaryTeamProfit: 267.5,
        commissionTeamCompanyShare: 84,
        onlineReceived: 200,
        depositedCash: 100,
      }),
    ).toEqual({
      dailyEarnings: 351.5,
      balanceReceived: 300,
      reconciliationDifference: 51.5,
    });
  });

  test("blocks closeout when job performance or payment handling is missing", () => {
    expect(
      canCloseJob({
        jobPerformed: true,
        invoiceCreatedAfterService: true,
        paymentStatus: "PAID",
      }),
    ).toBe(true);

    expect(
      canCloseJob({
        jobPerformed: true,
        invoiceCreatedAfterService: true,
        paymentStatus: "NOT_RECORDED",
      }),
    ).toBe(false);

    expect(
      canCloseJob({
        jobPerformed: false,
        invoiceCreatedAfterService: true,
        paymentStatus: "PAID",
      }),
    ).toBe(false);
  });
});
