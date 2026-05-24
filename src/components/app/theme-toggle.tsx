"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

const THEME_OPTIONS = [
  { value: "system", label: "跟随系统", icon: Monitor },
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = theme ?? "system";
  const icon =
    THEME_OPTIONS.find((option) => option.value === current)?.icon ?? Monitor;
  const Icon = icon;

  return (
    <label className="flex shrink-0 items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-sm text-muted-foreground">
      <Icon className="size-4" />
      <span className="hidden sm:inline">主题</span>
      <select
        aria-label="主题"
        suppressHydrationWarning
        className="bg-transparent text-foreground outline-none"
        value={current}
        onChange={(e) => setTheme(e.target.value)}
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
