import { describe, expect, test } from "vitest";

import { getNextTheme, resolveInitialTheme } from "./theme";

describe("theme helpers", () => {
  test("uses a stored theme when it is valid", () => {
    expect(resolveInitialTheme({ storedTheme: "dark", prefersDark: false })).toBe("dark");
    expect(resolveInitialTheme({ storedTheme: "light", prefersDark: true })).toBe("light");
  });

  test("falls back to system preference when stored theme is missing or invalid", () => {
    expect(resolveInitialTheme({ storedTheme: null, prefersDark: true })).toBe("dark");
    expect(resolveInitialTheme({ storedTheme: "system", prefersDark: false })).toBe("light");
  });

  test("toggles between light and dark", () => {
    expect(getNextTheme("light")).toBe("dark");
    expect(getNextTheme("dark")).toBe("light");
  });
});
