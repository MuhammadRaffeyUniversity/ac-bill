import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../../../prisma/schema.prisma", import.meta.url), "utf8");
const migrationUrl = new URL(
  "../../../prisma/migrations/20260717190000_add_team_payouts/migration.sql",
  import.meta.url,
);
const migration = existsSync(migrationUrl) ? readFileSync(migrationUrl, "utf8") : "";

describe("payout persistence", () => {
  it("stores member obligations and one full settlement", () => {
    expect(schema).toContain("enum PayoutObligationType");
    expect(schema).toContain("enum PayoutObligationStatus");
    expect(schema).toContain("model PayoutObligation");
    expect(schema).toContain("sourceKey");
    expect(schema).toContain("@unique");
    expect(schema).toContain("model Payout");
    expect(schema).toContain("obligationId");
  });

  it("adds database uniqueness for sources and settlements", () => {
    expect(migration).toContain('CREATE UNIQUE INDEX "PayoutObligation_sourceKey_key"');
    expect(migration).toContain('CREATE UNIQUE INDEX "Payout_obligationId_key"');
  });
});
