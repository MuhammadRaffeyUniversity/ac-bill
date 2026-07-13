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
});
