"use client";

import { motion, AnimatePresence } from "framer-motion";

type Props = {
  message: string | null;
};

export default function StatusToast({ message }: Props) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 border px-5 py-2.5 text-sm tracking-wider"
          style={{ borderRadius: "8px", borderColor: "var(--border-warm)", background: "var(--bg-soft)", color: "var(--text-primary)" }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
