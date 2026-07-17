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

  it("keeps new job creation visible from the populated mobile queue", () => {
    const queue = read("./job-action-queue.tsx");

    expect(queue).toContain('href="/jobs?mode=new"');
    expect(queue).toContain("mt-3 h-12 w-full lg:hidden");
    expect(queue).toContain("New WhatsApp job");
  });

  it("shows the selected team label instead of its stored database ID", () => {
    const assignment = read("./stages/assign-stage.tsx");

    expect(assignment).toContain("getDispatchSelectionLabel");
    expect(assignment).toContain("labelForValue={(value)");
  });

  it("fits desktop panes below the real header and themes their scrollbars", () => {
    const layout = read("../../app/(data-entry)/layout.tsx");
    const shell = read("./job-flow-shell.tsx");
    const queue = read("./job-action-queue.tsx");
    const styles = read("../../app/globals.css");

    expect(layout).toContain("lg:h-dvh");
    expect(layout).toContain("lg:grid-rows-[auto_minmax(0,1fr)]");
    expect(`${layout}\n${shell}\n${queue}`).not.toContain("calc(100vh-105px)");
    expect(shell).toContain('showWorkspace ? "hidden lg:block" : "block", "lg:min-h-0"');
    expect(shell).toContain("ops-scrollbar");
    expect(queue).toContain("ops-scrollbar");
    expect(styles).toContain(".ops-scrollbar");
    expect(styles).toContain("scrollbar-color:");
    expect(styles).toContain("::-webkit-scrollbar-thumb");
  });
});
