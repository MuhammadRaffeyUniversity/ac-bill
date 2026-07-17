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
    const linkActions = read("../../billing/customer-link-actions.tsx");
    expect(handoff).toContain("Open customer invoice");
    expect(handoff).toContain("Download PDF");
    expect(handoff).toContain("CustomerLinkActions");
    expect(handoff).toContain("Ready to send");
    expect(handoff).toContain("Customer documents");
    expect(handoff).toContain("Total");
    expect(handoff).toContain("Paid");
    expect(handoff).toContain("Due");
    expect(handoff).toContain('aria-label="Step 1"');
    expect(handoff).not.toContain("PrintButton");
    expect(handoff).not.toContain("Print invoice");
    expect(linkActions).not.toContain("Copy review link");
    expect(linkActions).toContain("Open customer review form");
    expect(linkActions).toContain("Copy customer message");
    expect(linkActions).toContain("Send to customer");
    expect(linkActions).toContain('aria-label="Step 2"');
    expect(linkActions).toContain('aria-live="polite"');
    expect(linkActions).toContain("Could not copy");
    expect(linkActions).toContain("Includes the invoice and feedback links");
    expect(linkActions).not.toContain("Copy review");
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
