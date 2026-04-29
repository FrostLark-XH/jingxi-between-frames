"use client";

import { motion } from "framer-motion";

export default function MemoryCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative overflow-hidden border border-border-subtle bg-bg-card px-4 py-4"
      style={{ borderRadius: "6px" }}
    >
      {/* Shimmer scan line */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/10 to-transparent"
        animate={{ y: ["-100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />

      <div className="mb-3 flex items-center justify-between">
        <div className="h-3 w-32 rounded bg-surface-1" />
        <div className="h-3 w-10 rounded bg-surface-1" />
      </div>

      <div className="mb-2.5 space-y-2">
        <div className="h-3.5 w-full rounded bg-surface-1" />
        <div className="h-3.5 w-4/5 rounded bg-surface-1" />
      </div>

      <div className="mb-3 space-y-1.5">
        <div className="h-2.5 w-full rounded bg-surface-2" />
        <div className="h-2.5 w-3/5 rounded bg-surface-2" />
      </div>

      <div className="mb-3 flex gap-1.5">
        <div className="h-5 w-10 bg-surface-1" style={{ borderRadius: "3px" }} />
        <div className="h-5 w-12 bg-surface-1" style={{ borderRadius: "3px" }} />
        <div className="h-5 w-8 bg-surface-1" style={{ borderRadius: "3px" }} />
      </div>

      <div className="flex items-center justify-between">
        <div className="h-3 w-16 rounded bg-surface-2" />
        <div className="h-3 w-8 rounded bg-surface-2" />
      </div>
    </motion.div>
  );
}
