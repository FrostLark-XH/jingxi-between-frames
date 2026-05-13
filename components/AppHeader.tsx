"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MoreHorizontal } from "lucide-react";

type Props = {
  title: string;
  onBack: () => void;
  backLabel: string;
  children?: React.ReactNode;
  mobilePrimaryAction?: React.ReactNode;
};

export default function AppHeader({ title, onBack, backLabel, children, mobilePrimaryAction }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest("[data-archive-panel-layer]")) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-40 mb-6 flex items-center h-12 shrink-0"
    >
      {/* Left: back button — always visible */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 shrink-0 whitespace-nowrap text-sm tracking-wider text-text-muted/70 hover:text-text-secondary transition-colors min-h-[44px] min-w-[44px]"
      >
        <ArrowLeft size={14} className="shrink-0" />
        <span className="inline max-w-[34vw] truncate sm:max-w-none">{backLabel}</span>
      </button>

      {/* Mobile center: page title — absolute so left/right are fixed */}
      <span className="absolute left-1/2 -translate-x-1/2 sm:hidden min-w-0 max-w-[45%] truncate whitespace-nowrap text-xs tracking-[0.15em] text-text-muted/50 pointer-events-none">
        {title}
      </span>

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Desktop: inline extras + title label */}
      <div className="hidden sm:flex items-center gap-4 pr-4 sm:pr-12">
        {children}
        <span className="shrink-0 whitespace-nowrap text-xs tracking-[0.15em] text-text-muted/50">
          {title}
        </span>
      </div>

      {/* Mobile: primary action + More button */}
      {(children || mobilePrimaryAction) && (
        <div className="sm:hidden relative flex shrink-0 items-center gap-1" ref={menuRef}>
          {mobilePrimaryAction && (
            <div className="[&_button]:min-h-[44px] [&_button]:min-w-[44px] [&_button]:justify-center [&_button]:text-text-muted/55">
              {mobilePrimaryAction}
            </div>
          )}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            aria-label="更多"
            className="flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px] text-text-muted/50 hover:text-text-muted/80 transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>

          <AnimatePresence>
            {moreOpen && children && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="paper-grain !absolute right-0 top-full z-50 mt-2 flex w-[calc(100vw-2rem)] max-w-[358px] flex-col gap-0.5 overflow-hidden rounded-card border border-border-soft bg-bg-soft/95 p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:min-w-[172px] sm:w-auto [&_button]:w-full [&_button]:justify-start [&_button]:rounded-button [&_button]:px-3 [&_button]:py-2 [&_button]:text-left [&_button]:text-xs [&_button]:min-h-[40px] [&_button]:text-text-muted/55 [&_button:hover]:bg-surface-2 [&_button:hover]:text-text-secondary"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.header>
  );
}
