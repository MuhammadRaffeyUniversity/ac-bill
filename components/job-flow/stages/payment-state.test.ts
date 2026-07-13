import { describe, expect, it } from "vitest";

import { getSubmittedPayments, type ReportPayment } from "./payment-state";

const payment: ReportPayment = {
  id: "payment-1",
  method: "CASH",
  amount: 120,
  collectedByTeam: true,
  referenceNumber: "",
  notes: "",
};

describe("team report payment state", () => {
  it.each(["UNPAID", "NO_CHARGE", "CANCELLED"] as const)(
    "does not submit payment rows for %s closeouts",
    (paymentStatus) => {
      expect(getSubmittedPayments(paymentStatus, [payment])).toEqual([]);
    },
  );

  it("keeps explicit payment ownership while removing UI-only ids", () => {
    expect(getSubmittedPayments("PAID", [payment])).toEqual([
      {
        method: "CASH",
        amount: 120,
        collectedByTeam: true,
        referenceNumber: "",
        notes: "",
      },
    ]);
  });
});
