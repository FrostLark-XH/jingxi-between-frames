"use client";

import { motion } from "framer-motion";

type Props = {
  onNewRecord: () => void;
};

export default function EmptyState({ onNewRecord }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 flex-col items-center justify-center py-20 text-center"
    >
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="mb-2 text-sm tracking-wider text-text-secondary"
      >
        还没有留下任何帧。
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mb-8 text-xs tracking-wider text-text-muted"
      >
        时间还没有开始显影。
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        onClick={onNewRecord}
        className="border border-border-subtle px-6 py-2.5 text-sm tracking-wider text-text-secondary transition-colors hover:border-accent/25 hover:text-text-primary active:scale-95"
        style={{ borderRadius: "8px" }}
      >
        留下第一帧
      </motion.button>
    </motion.div>
  );
}
