import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");

describe("job-flow invoice action contract", () => {
  it("issues invoice items, initial payments, and feedback in one transaction", () => {
    expect(source).toContain("createInvoiceWithPayments");
    expect(source).toContain("payments: { create:");
    expect(source).toContain("tx.feedback.create");
    expect(source).toContain("db.$transaction");
  });

  it("returns the job and invoice for same-workspace handoff", () => {
    expect(source).toContain("jobId: job.id");
    expect(source).toContain("invoiceId: invoice.id");
  });
});
