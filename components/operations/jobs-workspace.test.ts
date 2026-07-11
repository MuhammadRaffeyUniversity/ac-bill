import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const source = readFileSync(new URL("./jobs-workspace.tsx", import.meta.url), "utf8");

describe("closeout theme controls", () => {
  test("uses the tokenized select instead of browser-native option menus", () => {
    expect(source).toContain('from "@/components/ui/select"');
    expect(source).not.toContain("<select");
  });
});
