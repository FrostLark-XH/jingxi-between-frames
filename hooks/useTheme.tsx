"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  ThemeId,
  ThemeTokens,
  themes,
  DEFAULT_THEME,
  applyThemeToDocument,
} from "@/lib/themes";

const THEME_STORAGE_KEY = "jingxi_theme";

type ThemeContextValue = {
  theme: ThemeTokens;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadThemeId(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw && themes[raw as ThemeId]) return raw as ThemeId;
  } catch { /* ignore */ }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setThemeIdState(loadThemeId());
    setMounted(true);
  }, []);

  // Apply CSS variables whenever theme changes
  useEffect(() => {
    if (!mounted) return;
    applyThemeToDocument(themes[themeId]);

    const meta = document.querySelector('meta[name="theme-color"]');
    const color = themeId === "morning-grey" ? "#e8e1d3" : "#111318";
    if (meta) {
      meta.setAttribute("content", color);
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "theme-color";
      newMeta.content = color;
      document.head.appendChild(newMeta);
    }
  }, [themeId, mounted]);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch { /* ignore */ }
  }, []);

  const theme = themes[themeId];

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
