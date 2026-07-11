import { describe, expect, it } from "vitest";

import { getInvoiceHandoffPath } from "./closeout-handoff";

describe("getInvoiceHandoffPath", () => {
  it("takes a completed job directly to its invoice entry", () => {
    expect(getInvoiceHandoffPath("job with spaces", "COMPLETED")).toBe("/invoices?jobId=job%20with%20spaces");
  });

  it("does not offer invoice entry for a postponed or cancelled job", () => {
    expect(getInvoiceHandoffPath("job_1", "POSTPONED")).toBeNull();
    expect(getInvoiceHandoffPath("job_1", "CANCELLED")).toBeNull();
  });
});
