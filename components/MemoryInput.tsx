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

      {/* Input container */}
      <div className="relative">
        {/* Textarea — fades + blurs during developing */}
        <div
          className="transition-all duration-700 ease-out"
          style={{
            filter: isDeveloping ? "blur(2.5px)" : "blur(0px)",
            opacity: isDeveloping ? 0.45 : 1,
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

        {/* Developing sweep — a faint band of warm light drifting top → bottom */}
        {isDeveloping && (
          <div
            className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
            style={{ borderRadius: "8px" }}
          >
            <motion.div
              className="absolute left-0 right-0"
              style={{
                height: 16,
                background:
                  "linear-gradient(to bottom, transparent 0%, var(--accent-glow) 30%, var(--accent-glow) 70%, transparent 100%)",
                filter: "blur(3px)",
                opacity: 0.5,
              }}
              initial={{ top: "-16px" }}
              animate={{ top: "100%" }}
              transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        )}

        {/* Overlay glow — barely there, peaks mid-sweep */}
        {isDeveloping && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.08, 0.04, 0] }}
            transition={{ duration: 1.1, times: [0, 0.35, 0.7, 1], ease: "easeOut" }}
            style={{
              borderRadius: "8px",
              background:
                "radial-gradient(ellipse at 50% 50%, var(--accent-glow) 0%, transparent 70%)",
            }}
          />
        )}
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

      {/* Developing status — a quiet line of text during exposure */}
      {isDeveloping && (
        <motion.p
          className="mt-4 text-center text-xs tracking-[0.25em]"
          style={{ color: "var(--text-primary)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          这一帧正在显影
        </motion.p>
      )}
    </div>
  );
}
