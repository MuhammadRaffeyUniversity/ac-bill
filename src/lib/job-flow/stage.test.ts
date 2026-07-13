import { describe, expect, it } from "vitest";

import { resolveJobFlowStage } from "./stage";

describe("resolveJobFlowStage", () => {
  it("uses WhatsApp for a new unsaved flow", () => {
    expect(resolveJobFlowStage(null)).toBe("WHATSAPP");
  });

  it("uses assignment until a team is recorded", () => {
    expect(resolveJobFlowStage({ status: "BOOKED", assignedTeamId: null, performed: null, invoiceId: null })).toBe("ASSIGNMENT");
  });

  it("keeps assigned and postponed jobs in team report", () => {
    expect(resolveJobFlowStage({ status: "ASSIGNED", assignedTeamId: "team_1", performed: null, invoiceId: null })).toBe("TEAM_REPORT");
    expect(resolveJobFlowStage({ status: "POSTPONED", assignedTeamId: "team_1", performed: false, invoiceId: null })).toBe("TEAM_REPORT");
  });

  it("advances completed uninvoiced jobs to invoice", () => {
    expect(resolveJobFlowStage({ status: "COMPLETED", assignedTeamId: "team_1", performed: true, invoiceId: null })).toBe("INVOICE");
  });

  it("uses customer handoff once an invoice exists", () => {
    expect(resolveJobFlowStage({ status: "COMPLETED", assignedTeamId: "team_1", performed: true, invoiceId: "invoice_1" })).toBe("CUSTOMER_HANDOFF");
  });

  it("keeps cancelled jobs terminal at team report", () => {
    expect(resolveJobFlowStage({ status: "CANCELLED", assignedTeamId: null, performed: false, invoiceId: null })).toBe("TEAM_REPORT");
  });
});
