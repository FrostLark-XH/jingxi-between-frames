"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlignJustify } from "lucide-react";
import { formatText } from "@/lib/textFormat";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  nextFrameNumber: number;
  isDeveloping?: boolean;
  onFocusChange?: (focused: boolean) => void;
};

export default function MemoryInput({ value, onChange, onSave, nextFrameNumber, isDeveloping = false, onFocusChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Don't auto-focus on mobile — let user tap to start
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      textareaRef.current?.focus();
    }
    setMounted(true);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      onSave();
    }
  };

  const handleFormat = () => {
    if (!value.trim()) return;
    onChange(formatText(value));
  };

  // Defer frame number to avoid hydration mismatch (server always renders Frame 001)
  const isFirstFrame = nextFrameNumber === 1;
  const frameLabel = mounted
    ? `Frame ${nextFrameNumber.toString().padStart(3, "0")}`
    : "Frame 001";

  return (
    <div className="relative">
      {/* Status bar */}
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-mono text-[10px] tracking-[0.15em] text-text-muted/40">
          {isFirstFrame ? "准备留下第一帧" : "下一帧"}
        </span>
        {!isFirstFrame && (
          <span className="font-mono text-[10px] tracking-[0.1em] text-text-muted/30">
            {frameLabel}
          </span>
        )}
      </div>

      {/* Input container with developing animation — CSS transition for smooth GPU blur */}
      <div
        className="transition-all duration-500 ease-out"
        style={{
          filter: isDeveloping ? "blur(2px)" : "blur(0px)",
          opacity: isDeveloping ? 0.55 : 1,
          willChange: isDeveloping ? "filter, opacity" : "auto",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          placeholder="今天，有什么被你记住了？"
          rows={5}
          className="w-full resize-none border border-border-subtle bg-bg-soft/60 px-5 py-5 text-base leading-relaxed text-text-primary placeholder:text-primary/12 transition-colors focus:border-accent/25 focus:bg-bg-soft/80 focus:outline-none"
          style={{
            minHeight: "35vh",
            borderRadius: "8px",
            borderLeftColor: "var(--border-warm)",
            borderLeftWidth: "1px",
            boxShadow: "inset 0 0 40px var(--accent-glow), inset 0 1px 0 var(--surface-1)",
          }}
        />
      </div>

      {/* Character count + format button */}
      {value.length > 0 && (
        <div className="mt-1.5 flex items-center justify-between">
          <button
            onClick={handleFormat}
            className="flex items-center gap-1 font-mono text-[10px] text-text-muted/30 transition-colors hover:text-text-muted/60"
          >
            <AlignJustify size={10} />
            缩进
          </button>
          <span className="font-mono text-[10px] text-text-muted/25">
            {value.length} 字
          </span>
        </div>
      )}

      {/* Developing overlay pulse */}
      {isDeveloping && (
        <motion.div
          className="pointer-events-none absolute inset-0 top-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.12, 0] }}
          transition={{ duration: 1.0, ease: "easeInOut" }}
          style={{
            borderRadius: "8px",
            background: "radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)",
          }}
        />
      )}
    </div>
  );
}
