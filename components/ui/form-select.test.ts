import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const formFiles = [
  "../operations/dispatch-workspace.tsx",
  "../operations/expenses-workspace.tsx",
  "../team-entries/team-entries-workspace.tsx",
  "../team-setup/team-setup-workspace.tsx",
  "../billing/invoice-workspace.tsx",
  "../ledger/ledger-workspace.tsx",
];

describe("themed form selects", () => {
  test("replaces all remaining browser-native selects in operations forms", () => {
    for (const file of formFiles) {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");

      expect(source).toContain('from "@/components/ui/form-select"');
      expect(source).not.toContain("<select");
    }
  });
});
