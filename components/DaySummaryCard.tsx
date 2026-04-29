"use client";

import { motion } from "framer-motion";

type Props = {
  date: string;
  frameCount: number;
  topTags: string[];
};

export default function DaySummaryCard({ date, frameCount, topTags }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      className="relative mb-8 overflow-hidden border border-border-subtle bg-bg-soft/40 px-6 py-5"
      style={{ borderRadius: "8px", background: "var(--surface-1)" }}
    >
      {/* Left accent — mirror-gap hint */}
      <div
        className="absolute left-0 top-3 bottom-3 w-px"
        style={{ background: "var(--border-warm)" }}
      />

      {/* Date line */}
      <div className="mb-4 font-mono text-sm tracking-[0.15em] text-text-primary">
        {date}
      </div>

      {/* Frame count — the focal line */}
      <p className="mb-4 text-base leading-relaxed tracking-wider text-text-secondary">
        你留下了 {frameCount} 帧。
      </p>

      {/* Subtle divider */}
      <div
        className="mb-4 h-px w-full"
        style={{ background: "var(--border-soft)" }}
      />

      {/* Recurring words */}
      {topTags.length > 0 && (
        <p className="text-xs leading-relaxed tracking-wider text-text-muted">
          今天反复出现的词：{topTags.join(" / ")}
        </p>
      )}
    </motion.div>
  );
}
