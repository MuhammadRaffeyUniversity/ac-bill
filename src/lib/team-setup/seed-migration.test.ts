import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "prisma/migrations/20260711153000_add_seed_identities/migration.sql",
  ),
  "utf8",
);

describe("seed identity migration", () => {
  it("guards and identifies the active global salary and commission rules", () => {
    expect(migration).toContain('FROM "CommissionRule"');
    expect(migration).toContain('"teamId" IS NULL');
    expect(migration).toContain('"effectiveTo" IS NULL');
    expect(migration).toContain("'Cannot add global CommissionRule seed keys:");
    expect(migration).toContain("'initial-global-salary'");
    expect(migration).toContain("'initial-global-commission'");
  });
});
