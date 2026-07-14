import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("mobile sidebar navigation", () => {
  it("uses an accessible left drawer that closes after navigation", () => {
    const source = read("./mobile-sidebar.tsx");

    expect(source).toContain('aria-label="Open navigation menu"');
    expect(source).toContain('side="left"');
    expect(source).toContain("onNavigate={() => setOpen(false)}");
    expect(source).toContain("lg:hidden");
  });

  it("replaces the mobile navigation strip in Data Entry and CEO views", () => {
    const dataEntry = read("../../app/(data-entry)/layout.tsx");
    const ceo = read("../../app/(ceo)/page.tsx");

    expect(dataEntry).toContain("<MobileSidebar");
    expect(dataEntry).toContain('className="hidden');
    expect(ceo).toContain("<MobileSidebar");
    expect(ceo).toContain('className="hidden');
  });
});
