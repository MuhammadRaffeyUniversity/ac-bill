import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");

describe("job-flow stages", () => {
  it("keeps initial intake and team completion responsibilities separate", () => {
    expect(read("./intake-stage.tsx")).toContain("IntakeWorkspace");
    const report = read("./report-stage.tsx");
    expect(report).toContain("Original WhatsApp update");
    expect(report).toContain("No AI");
    expect(report).toContain("Split payment");
    expect(report).toContain("Reporting team member");
  });

  it("keeps customer deliverables together", () => {
    const handoff = read("./handoff-stage.tsx");
    expect(handoff).toContain("Open customer invoice");
    expect(handoff).toContain("Download PDF");
    expect(handoff).toContain("Print invoice");
    expect(handoff).toContain("CustomerLinkActions");
  });

  it("lets the operator review more than one invoice line", () => {
    const invoice = read("./invoice-stage.tsx");
    expect(invoice).toContain("Invoice items");
    expect(invoice).toContain("Add line");
    expect(invoice).toContain("items.map");
    expect(invoice).toContain("Initial payments");
    expect(invoice).toContain("Add payment");
  });
});
