import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const source = readFileSync(new URL("./intake-workspace.tsx", import.meta.url), "utf8");

describe("intake review theme controls", () => {
  test("uses the tokenized select and avoids fixed amber missing-field colors", () => {
    expect(source).toContain('from "@/components/ui/select"');
    expect(source).not.toContain('<select name="serviceType"');
    expect(source).not.toContain("border-amber-300");
    expect(source).not.toContain("bg-amber-50");
    expect(source).not.toContain("text-amber-800");
  });
});
