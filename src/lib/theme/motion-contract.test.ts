import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("responsive motion system", () => {
  it("defines restrained global motion with a reduced-motion fallback", () => {
    const styles = read("../../../app/globals.css");

    expect(styles).toContain("--motion-duration-fast: 120ms");
    expect(styles).toContain("--motion-duration-base: 180ms");
    expect(styles).toContain('[data-motion="page"]');
    expect(styles).toContain('[data-motion="item"]');
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("shows immediate pending feedback while credentials are submitted", () => {
    const submitPath = new URL("../../../components/auth/sign-in-submit.tsx", import.meta.url);
    expect(existsSync(submitPath)).toBe(true);

    const submit = read("../../../components/auth/sign-in-submit.tsx");
    const page = read("../../../app/signin/page.tsx");
    expect(submit).toContain("useFormStatus");
    expect(submit).toContain("Signing in");
    expect(page).toContain("<SignInSubmit");
    expect(page).toContain('data-motion="page"');
  });

  it("adopts shared motion hooks in staff, CEO, workflow, and public shells", () => {
    const sources = [
      read("../../../app/(data-entry)/layout.tsx"),
      read("../../../app/(ceo)/page.tsx"),
      read("../../../components/operations-shell.tsx"),
      read("../../../components/job-flow/job-flow-shell.tsx"),
      read("../../../app/invoice/[token]/page.tsx"),
      read("../../../app/feedback/[token]/page.tsx"),
    ];

    for (const source of sources) expect(source).toContain('data-motion="page"');
  });
});
