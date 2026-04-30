"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { ThemeId, themeList } from "@/lib/themes";
import { Palette } from "lucide-react";
import { useState } from "react";

export default function ThemeSwitcher() {
  const { themeId, setThemeId } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="切换主题"
        className="flex h-7 w-7 items-center justify-center text-text-muted/25 transition-colors hover:text-text-muted/60"
      >
        <Palette size={13} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-8 z-50 w-36 overflow-hidden border border-border-subtle py-1"
              style={{
                borderRadius: "8px",
                background: "var(--bg-soft)",
              }}
            >
              {themeList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setThemeId(t.id as ThemeId);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs tracking-wider transition-colors hover:bg-surface-2"
                  style={{
                    color: themeId === t.id ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                  {t.name}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
