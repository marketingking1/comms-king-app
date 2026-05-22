"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Alternar tema"
        disabled
        className="h-8 w-8 rounded-lg"
      />
    );
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      aria-label={isDark ? "Mudar pra tema claro" : "Mudar pra tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-8 w-8 rounded-lg flex items-center justify-center text-current/70 hover:text-current hover:bg-current/10 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
