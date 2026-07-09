"use client";

import { MonitorCogIcon, MoonIcon, SunIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { getNextTheme, resolveInitialTheme, type AppTheme } from "@/src/lib/theme/theme";

const storageKey = "ac-bill-theme";

function applyTheme(theme: AppTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function getBrowserTheme(): AppTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerTheme(): AppTheme {
  return "light";
}

function subscribeToThemeChange(onStoreChange: () => void) {
  window.addEventListener("ac-bill-theme-change", onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("ac-bill-theme-change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToThemeChange, getBrowserTheme, getServerTheme);

  function toggleTheme() {
    const currentTheme = resolveInitialTheme({
      storedTheme: window.localStorage.getItem(storageKey),
      prefersDark: getBrowserTheme() === "dark",
    });
    const nextTheme = getNextTheme(currentTheme);

    applyTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
    window.dispatchEvent(new Event("ac-bill-theme-change"));
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      className="group h-9 gap-2 overflow-hidden px-2.5"
      onClick={toggleTheme}
      suppressHydrationWarning
    >
      <span className="relative h-5 w-10 rounded-full bg-muted shadow-inner ring-1 ring-border transition-colors duration-300 group-aria-pressed:bg-primary/20">
        <span className="absolute inset-y-0.5 left-0.5 flex size-4 items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-500 ease-out group-aria-pressed:translate-x-5">
          <SunIcon className="absolute opacity-100 transition-all duration-300 group-aria-pressed:rotate-90 group-aria-pressed:scale-50 group-aria-pressed:opacity-0" />
          <MoonIcon className="absolute -rotate-90 scale-50 opacity-0 transition-all duration-300 group-aria-pressed:rotate-0 group-aria-pressed:scale-100 group-aria-pressed:opacity-100" />
        </span>
      </span>
      <span className="hidden text-sm font-medium sm:inline" suppressHydrationWarning>
        {isDark ? "Dark" : "Light"}
      </span>
      <MonitorCogIcon className="text-muted-foreground" data-icon="inline-end" />
    </Button>
  );
}
