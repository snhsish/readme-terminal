"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { iconBtn } from "./ui";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="Toggle light / dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={iconBtn}
    >
      <Sun size={15} className="dark:hidden" />
      <Moon size={15} className="hidden dark:block" />
    </button>
  );
}
