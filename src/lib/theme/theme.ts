export type AppTheme = "light" | "dark";

type ResolveInitialThemeInput = {
  storedTheme: string | null;
  prefersDark: boolean;
};

export function resolveInitialTheme({ storedTheme, prefersDark }: ResolveInitialThemeInput): AppTheme {
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return prefersDark ? "dark" : "light";
}

export function getNextTheme(theme: AppTheme): AppTheme {
  return theme === "dark" ? "light" : "dark";
}
