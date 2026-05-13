"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ThemeSwitcher from "./ThemeSwitcher";

type Props = {
  children: React.ReactNode;
  hideThemeSwitcher?: boolean;
};

const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL;

export default function AppShell({ children, hideThemeSwitcher = false }: Props) {
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("hydrated");
  }, []);

  return (
    <div ref={constraintsRef} className="relative min-h-screen min-h-dvh w-full overflow-x-hidden">
      {/* Top-right controls */}
      {!hideThemeSwitcher && (
        <div
          className="fixed right-4 top-4 z-30 flex items-center gap-3"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          {FEEDBACK_URL && (
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-wider text-text-muted/35 transition-colors hover:text-text-muted/70"
            >
              反馈体验
            </a>
          )}
          <ThemeSwitcher />
        </div>
      )}

      {/* Content container — mobile-first max-width */}
      <motion.div
        className="relative z-10 mx-auto flex min-h-screen min-h-dvh max-w-app flex-col px-5 pb-8"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 16px) + 16px)" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
