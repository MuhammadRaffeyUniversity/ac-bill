import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const jobsPage = readFileSync(new URL("../../../app/(data-entry)/jobs/page.tsx", import.meta.url), "utf8");
const operationsActions = readFileSync(new URL("../operations/actions.ts", import.meta.url), "utf8");
const billingActions = readFileSync(new URL("../billing/actions.ts", import.meta.url), "utf8");

describe("unified job-flow security boundaries", () => {
  it("loads handoff tokens only for billing-capable roles", () => {
    expect(jobsPage).toContain("canAccessCustomerHandoff");
    expect(jobsPage).toContain("handoffTokens");
    expect(jobsPage).toContain("feedback: { select: { id: true } }");
    expect(jobsPage).toContain("loadHandoffTokens");
  });

  it("blocks legacy closeout and invoice mutations", () => {
    expect(operationsActions).toContain("Use the guided job flow to close this job");
    expect(billingActions).toContain("Use the guided job flow to issue this invoice");
  });
});
