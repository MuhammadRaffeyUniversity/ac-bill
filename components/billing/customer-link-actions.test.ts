import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./customer-link-actions.tsx", import.meta.url), "utf8");

describe("customer handoff links", () => {
  it("can copy one customer message containing invoice and feedback links", () => {
    expect(source).toContain("invoicePath?: string");
    expect(source).toContain("Copy customer message");
    expect(source).toContain("invoiceUrl");
    expect(source).toContain("feedbackUrl");
  });
});
