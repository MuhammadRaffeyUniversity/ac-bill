import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");

describe("job-flow invoice action contract", () => {
  it("issues invoice items, initial payments, and feedback in one transaction", () => {
    expect(source).toContain("createInvoiceWithPayments");
    expect(source).toContain("payments: { create:");
    expect(source).toContain("tx.feedback.create");
    expect(source).toContain("tx.commissionEntry.create");
    expect(source).toContain("tx.payoutObligation.createMany");
    expect(source).toContain("db.$transaction");
  });

  it("returns the job and invoice for same-workspace handoff", () => {
    expect(source).toContain("jobId: job.id");
    expect(source).toContain("invoiceId: invoice.id");
  });

  it("requires performed work with an approved manual completion audit", () => {
    expect(source).toContain("performed: true");
    expect(source).toContain("TeamEntryType.COMPLETION");
    expect(source).toContain("ReviewStatus.APPROVED");
    expect(source).toContain("JOB_NOT_READY");
  });

  it("requires an auditable partner, team members, and commission rule", () => {
    expect(source).toContain("sourcePartnerId");
    expect(source).toContain("commissionRules");
    expect(source).toContain("COMMISSION_CONFIGURATION_INVALID");
  });
});
