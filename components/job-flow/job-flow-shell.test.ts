import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");

describe("guided job desk", () => {
  it("renders one action queue and the five persisted stages", () => {
    const shell = `${read("./job-flow-shell.tsx")}\n${read("./job-action-queue.tsx")}`;
    const rail = read("./job-stage-rail.tsx");
    expect(shell).toContain("Needs action");
    expect(shell).toContain("New WhatsApp job");
    expect(shell).toContain("Back to jobs");
    expect(rail).toContain("WhatsApp");
    expect(rail).toContain("Assignment");
    expect(rail).toContain("Team report");
    expect(rail).toContain("Invoice");
    expect(rail).toContain("Customer handoff");
  });

  it("uses semantic theme tokens instead of fixed light-only surfaces", () => {
    const sources = [read("./job-flow-shell.tsx"), read("./job-action-queue.tsx"), read("./job-stage-rail.tsx")].join("\n");
    expect(sources).not.toContain("bg-white");
    expect(sources).not.toContain("text-black");
    expect(sources).not.toContain("bg-amber-50");
    expect(sources).not.toContain("<select");
    expect(sources).toContain("bg-action-required-muted");
  });

  it("lets selected-job content shrink and wraps mobile toolbar actions", () => {
    const shell = read("./job-flow-shell.tsx");
    const page = read("../../app/(data-entry)/jobs/page.tsx");

    expect(shell).toContain("grid-cols-[minmax(0,1fr)] lg:grid-cols-[310px_minmax(0,1fr)]");
    expect(shell).toContain("mb-4 flex flex-wrap items-center");
    expect(page).toContain('return <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">');
  });
});
