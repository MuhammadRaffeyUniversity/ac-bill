import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");

describe("job-flow closeout action contract", () => {
  it("stores the approved raw team report and closeout in one transaction", () => {
    expect(source).toContain("db.$transaction");
    expect(source).toContain("ReviewStatus.APPROVED");
    expect(source).toContain("rawWhatsAppText: data.rawWhatsAppText");
    expect(source).toContain("statusHistory:");
  });

  it("guards stale selected jobs before writing", () => {
    expect(source).toContain("expectedUpdatedAt");
    expect(source).toContain("This job changed since you opened it");
  });
});
