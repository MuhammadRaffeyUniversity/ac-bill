import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("unified job-flow routes", () => {
  it("shows one core job-flow destination in the data-entry layout", () => {
    const source = read("../../../app/(data-entry)/layout.tsx");
    expect(source).toContain('label: "Job flow"');
    expect(source).not.toContain('label: "Intake"');
    expect(source).not.toContain('label: "Dispatch"');
    expect(source).not.toContain('label: "Team updates"');
    expect(source).not.toContain('label: "Invoices"');
  });

  it("redirects legacy operational pages into the job flow", () => {
    expect(read("../../../app/(data-entry)/jobs/intake/page.tsx")).toContain('redirect("/jobs?mode=new")');
    expect(read("../../../app/(data-entry)/dispatch/page.tsx")).toContain('redirect("/jobs?view=assignment")');
    expect(read("../../../app/(data-entry)/team-entries/page.tsx")).toContain('redirect("/jobs?view=team-report")');
    expect(read("../../../app/(data-entry)/invoices/page.tsx")).toContain('redirect("/jobs?view=invoice")');
  });
});
