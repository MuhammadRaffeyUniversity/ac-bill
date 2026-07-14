import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const jobsPage = readFileSync(new URL("../../../app/(data-entry)/jobs/page.tsx", import.meta.url), "utf8");
const jobsLoadingUrl = new URL("../../../app/(data-entry)/jobs/loading.tsx", import.meta.url);
const jobsLoading = existsSync(jobsLoadingUrl) ? readFileSync(jobsLoadingUrl, "utf8") : "";
const prismaSchema = readFileSync(new URL("../../../prisma/schema.prisma", import.meta.url), "utf8");

describe("job desk performance contract", () => {
  it("keeps the job desk responsive while relation-heavy reads are loading", () => {
    expect(prismaSchema).toContain('previewFeatures = ["relationJoins"]');
    expect(jobsPage.match(/relationLoadStrategy: "join"/g)).toHaveLength(3);
    expect(jobsPage).toContain("selectedId ? db.team.findMany");
    expect(jobsLoading).toContain("Loading jobs");
    expect(jobsLoading).toContain("animate-pulse");
  });
});
