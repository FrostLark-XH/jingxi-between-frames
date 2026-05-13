"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

type Props = {
  text: string;
  onSave: () => void;
  isDeveloping?: boolean;
};

export default function ActionBar({ text, onSave, isDeveloping = false }: Props) {
  const isActive = Boolean(text.trim() && !isDeveloping);
  const firedRef = useRef(false);

  const handleFire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onSave();
    setTimeout(() => { firedRef.current = false; }, 800);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Save button — pointerDown fires before iOS keyboard dismiss and
          sticky-bar reposition. No preventDefault so focus/blur flows naturally. */}
      <motion.button
        type="button"
        onPointerDown={handleFire}
        onClick={handleFire}
        disabled={!text.trim() || isDeveloping}
        className="flex h-12 flex-1 items-center justify-center text-sm font-medium tracking-wider text-text-primary active:scale-[0.98] disabled:opacity-25"
        style={{
          borderRadius: "8px",
          background: isActive
            ? "linear-gradient(135deg, var(--accent) 0%, var(--accent-soft) 100%)"
            : "var(--surface-2)",
          opacity: isDeveloping ? 0.5 : undefined,
          touchAction: "manipulation",
        }}
        animate={
          isActive
            ? { boxShadow: ["0 0 8px var(--accent-glow)", "0 0 18px var(--accent-glow)", "0 0 8px var(--accent-glow)"] }
            : { boxShadow: "none" }
        }
        transition={
          isActive
            ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      >
        {isDeveloping ? "显影中..." : "开始显影"}
      </motion.button>
    </div>
  );
}
