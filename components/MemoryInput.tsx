"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlignJustify } from "lucide-react";

function indentLines(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (line.length === 0) return line;
      if (line.startsWith("　　")) return line;
      return "　　" + line;
    })
    .join("\n");
}

function stripIndent(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.startsWith("　　") ? line.slice(2) : line))
    .join("\n");
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  nextFrameNumber: number;
  isDeveloping?: boolean;
  onFocusChange?: (focused: boolean) => void;
  showHint?: boolean;
};

export default function MemoryInput({ value, onChange, onSave, nextFrameNumber, isDeveloping = false, onFocusChange, showHint = false }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);
  const [autoIndent, setAutoIndent] = useState(true);

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

  const handleToggleIndent = () => {
    setAutoIndent(!autoIndent);
  };

  const displayValue = autoIndent && value.trim() ? indentLines(value) : value;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = autoIndent ? stripIndent(e.target.value) : e.target.value;
    onChange(raw);
  };

  const isFirstFrame = nextFrameNumber === 1;
  const frameLabel = mounted
    ? `Frame ${nextFrameNumber.toString().padStart(3, "0")}`
    : "Frame 001";

  return (
    <div className="relative">
      {/* Status bar */}
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-mono text-micro tracking-[0.15em] text-text-muted/40">
          {isFirstFrame ? "准备留下第一帧" : "下一帧"}
        </span>
        {!isFirstFrame && (
          <span className="font-mono text-micro tracking-[0.1em] text-text-muted/30">
            {frameLabel}
          </span>
        )}
      </div>

      {/* First-visit hint — gentle nudge toward the first frame */}
      {showHint && !value.trim() && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="mb-3 text-center font-serif text-xs italic tracking-wider"
          style={{ color: "color-mix(in srgb, var(--accent) 50%, var(--text-primary) 50%)" }}
        >
          把这一瞬留成一帧。
        </motion.p>
      )}

      {/* Input container */}
      <div className="relative">
        {/* First-visit warm light — tiny safelight speck near the paper edge */}
        {showHint && !value.trim() && (
          <motion.div
            className="pointer-events-none absolute z-10 rounded-full"
            style={{
              width: 5,
              height: 5,
              left: 8,
              top: 12,
              background: "var(--accent)",
              filter: "blur(2.5px)",
            }}
            animate={{ opacity: [0.1, 0.28, 0.1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {/* Textarea — stays fully visible; the developing feel comes from the light sweep + border glow */}
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          placeholder="今天，有什么被你记住了？"
          rows={5}
          className="w-full resize-none border border-border-subtle bg-bg-soft/60 px-5 py-5 text-base leading-relaxed text-text-primary placeholder:text-primary/12 transition-all duration-700 focus:border-accent/25 focus:bg-bg-soft/80 focus:outline-none rounded-card border-l border-l-border-warm"
          data-developing={isDeveloping ? "true" : undefined}
          style={{
            minHeight: "35vh",
            boxShadow: "inset 0 0 40px var(--accent-glow), inset 0 1px 0 var(--surface-1)",
          }}
        />

        {/* Developing wash — warm organic clouds + grain, like developer solution flowing over photo paper */}
        {isDeveloping && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 rounded-card overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.25, times: [0, 0.12, 0.82, 1], ease: "easeInOut" }}
          >
            {/* Main cloud — leads the wash, softer centre */}
            <motion.div
              className="absolute left-0 right-0 h-9"
              style={{
                filter: "blur(10px)",
                background:
                  "radial-gradient(ellipse 55% 45% at 50% 50%, var(--accent-soft) 0%, var(--accent-glow) 35%, transparent 70%)",
                opacity: 0.3,
                borderRadius: "58% 42% 55% 45%",
              }}
              initial={{ top: "-36px" }}
              animate={{ top: "calc(100% + 36px)" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />

            {/* Secondary cloud — smaller, offset, trails behind for organic unevenness */}
            <motion.div
              className="absolute h-7"
              style={{
                left: "8%",
                right: "18%",
                filter: "blur(12px)",
                background:
                  "radial-gradient(ellipse 40% 38% at 50% 50%, var(--accent-glow) 0%, transparent 65%)",
                opacity: 0.22,
                borderRadius: "45% 55% 50% 50%",
              }}
              initial={{ top: "-28px" }}
              animate={{ top: "calc(100% + 28px)" }}
              transition={{ duration: 1.25, ease: "easeInOut", delay: 0.08 }}
            />

            {/* Micro grain — breaks mechanical precision, too faint to feel dirty */}
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                backgroundRepeat: "repeat",
                backgroundSize: "200px 200px",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.018 }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        )}
      </div>

      {/* Character count + indent toggle */}
      {value.length > 0 && (
        <div className="mt-1.5 flex items-center justify-between">
          <button
            onClick={handleToggleIndent}
            className="flex items-center gap-1 font-mono text-micro transition-colors"
            style={{ color: autoIndent ? "var(--accent-soft)" : "color-mix(in srgb, var(--text-primary) 30%, transparent)" }}
          >
            <AlignJustify size={10} />
            首行缩进
          </button>
          <span className="font-mono text-micro text-text-muted/25">
            {value.length} 字
          </span>
        </div>
      )}

      {/* Developing status — warm safelight glow */}
      {isDeveloping && (
        <motion.p
          className="mt-5 text-center font-serif text-xs tracking-[0.2em]"
          style={{ color: "var(--accent-soft)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        >
          这一帧正在显影...
        </motion.p>
      )}
    </div>
  );
}
