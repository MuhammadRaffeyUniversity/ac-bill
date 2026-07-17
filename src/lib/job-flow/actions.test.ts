import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");

describe("job-flow closeout action contract", () => {
  it("stores the approved raw team report and closeout in one transaction", () => {
    expect(source).toContain("db.$transaction");
    expect(source).toContain("ReviewStatus.APPROVED");
    expect(source).toContain("rawWhatsAppText: data.rawWhatsAppText");
    expect(source).toContain("tx.jobStatusHistory.create");
    expect(source).toContain("const note = data.note || undefined");
    expect(source).toContain("remarks: note ?? null");
    expect(source).toContain('cancellationReason: data.status === "CANCELLED" ? note ?? null : null');
  });

  it("guards stale selected jobs before writing", () => {
    expect(source).toContain("expectedUpdatedAt");
    expect(source).toContain("tx.job.updateMany");
    expect(source).toContain("updated.count !== 1");
    expect(source).toContain("This job changed since you opened it");
  });
});
