"use client";

import { motion } from "framer-motion";
import { TimeScale } from "@/data/demoFrames";

const allScales: { key: TimeScale; label: string; minFrames: number }[] = [
  { key: "year", label: "年", minFrames: 30 },
  { key: "month", label: "月", minFrames: 10 },
  { key: "day", label: "日", minFrames: 0 },
  { key: "fragment", label: "片段", minFrames: 0 },
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
  const scales = allScales.filter((s) => totalFrameCount >= s.minFrames);

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
      {scales.map((s) => {
        const isActive = current === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`relative flex-1 py-1.5 text-sm transition-colors ${
              isActive
                ? "text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
            style={{ borderRadius: "4px" }}
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
