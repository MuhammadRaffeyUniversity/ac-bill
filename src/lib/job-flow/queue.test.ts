import { describe, expect, it } from "vitest";

import { compareJobQueueItems, getJobQueueGroup } from "./queue";

describe("job-flow queue", () => {
  it("groups persisted stages into operator actions", () => {
    expect(getJobQueueGroup({ status: "BOOKED", assignedTeamId: null, performed: null, invoiceId: null })).toBe("ASSIGN_TEAM");
    expect(getJobQueueGroup({ status: "ASSIGNED", assignedTeamId: "team_1", performed: null, invoiceId: null })).toBe("TEAM_REPORT");
    expect(getJobQueueGroup({ status: "COMPLETED", assignedTeamId: "team_1", performed: true, invoiceId: null })).toBe("CREATE_INVOICE");
    expect(getJobQueueGroup({ status: "COMPLETED", assignedTeamId: "team_1", performed: true, invoiceId: "invoice_1" })).toBe("CUSTOMER_HANDOFF");
    expect(getJobQueueGroup({ status: "CANCELLED", assignedTeamId: "team_1", performed: false, invoiceId: null })).toBe("CANCELLED");
  });

  it("sorts invoice and assignment actions before waiting work", () => {
    const rows = [
      { group: "TEAM_REPORT" as const, requestedAt: null, createdAt: "2026-07-13T10:00:00.000Z" },
      { group: "ASSIGN_TEAM" as const, requestedAt: null, createdAt: "2026-07-13T11:00:00.000Z" },
      { group: "CREATE_INVOICE" as const, requestedAt: null, createdAt: "2026-07-13T09:00:00.000Z" },
    ];

    expect(rows.sort(compareJobQueueItems).map((row) => row.group)).toEqual(["CREATE_INVOICE", "ASSIGN_TEAM", "TEAM_REPORT"]);
  });

  it("sorts the oldest requested work first within a group", () => {
    const rows = [
      { group: "TEAM_REPORT" as const, requestedAt: "2026-07-14T10:00:00.000Z", createdAt: "2026-07-13T09:00:00.000Z" },
      { group: "TEAM_REPORT" as const, requestedAt: "2026-07-13T10:00:00.000Z", createdAt: "2026-07-13T11:00:00.000Z" },
    ];

    expect(rows.sort(compareJobQueueItems)[0]?.requestedAt).toBe("2026-07-13T10:00:00.000Z");
  });
});
