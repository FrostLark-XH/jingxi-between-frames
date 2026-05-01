"use client";

import { motion } from "framer-motion";
import { TimeScale } from "@/data/demoFrames";

type ScaleInfo = {
  key: TimeScale;
  label: string;
  minFrames: number;
};

const allScales: ScaleInfo[] = [
  { key: "year", label: "年", minFrames: 30 },
  { key: "month", label: "月", minFrames: 10 },
  { key: "day", label: "日", minFrames: 0 },
];

type Props = {
  current: TimeScale;
  onChange: (scale: TimeScale) => void;
  totalFrameCount: number;
  staggerDelay?: number;
};

export default function TimeScaleSwitcher({
  current,
  onChange,
  totalFrameCount,
  staggerDelay = 0,
}: Props) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: staggerDelay + 0.15,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="flex gap-1 bg-bg-soft p-1"
      style={{ borderRadius: "6px" }}
    >
      {allScales.map((s) => {
        const isActive = current === s.key;
        const isDisabled = totalFrameCount < s.minFrames;

        return (
          <button
            key={s.key}
            onClick={() => !isDisabled && onChange(s.key)}
            disabled={isDisabled}
            className={`relative flex-1 py-3 text-sm transition-colors touch-manipulation ${
              isDisabled
                ? "cursor-not-allowed opacity-30"
                : isActive
                  ? "text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
            }`}
            style={{ borderRadius: "4px", minHeight: "48px" }}
          >
            {isActive && (
              <motion.div
                layoutId="timescale-active"
                className="absolute inset-0 border border-border-subtle bg-surface-active"
                style={{ borderRadius: "4px" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{s.label}</span>
          </button>
        );
      })}
    </motion.nav>
  );
}
