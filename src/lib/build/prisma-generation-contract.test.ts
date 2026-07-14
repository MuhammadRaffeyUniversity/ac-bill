import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("production build contract", () => {
  it("generates the ignored Prisma client before Next.js compiles", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.build).toBe("prisma generate && next build");
  });
});
