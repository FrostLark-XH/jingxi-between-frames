"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { MemoryFrame } from "@/data/demoFrames";
import { getAiProvider } from "@/services/ai";
import useIsMobile from "@/hooks/useIsMobile";
import MemoryInput from "./MemoryInput";
import ActionBar from "./ActionBar";

type Props = {
  draftText: string;
  onDraftChange: (text: string) => void;
  onDraftClear: () => void;
  onSave: (frame: MemoryFrame) => void;
  onViewFilm: () => void;
  todayFrameCount: number;
  nextFrameIndex: number;
  showToast: (message: string) => void;
};

export default function RecordingRoom({ draftText, onDraftChange, onDraftClear, onSave, onViewFilm, todayFrameCount, nextFrameIndex, showToast }: Props) {
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isMobile = useIsMobile();
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFocusChange = (focused: boolean) => {
    if (focused) {
      if (blurTimerRef.current) { clearTimeout(blurTimerRef.current); blurTimerRef.current = null; }
      setIsFocused(true);
    } else {
      // Delay hiding the sticky bar so click events on the button can fire
      blurTimerRef.current = setTimeout(() => setIsFocused(false), 150);
    }
  };

  const handleSave = async () => {
    const trimmed = draftText.trim();
    if (!trimmed) {
      showToast("先写下些什么吧");
      return;
    }
    if (isDeveloping) return;

    setIsDeveloping(true);

    // Developing animation plays for 600ms before saving
    setTimeout(async () => {
      const now = new Date();
      const iso = now.toISOString();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const wordCount = trimmed.length;

      const provider = getAiProvider();
      const { summary, tags } = await provider.processFrame({ content: trimmed });

      const frame: MemoryFrame = {
        id: `frame-${Date.now()}`,
        content: trimmed,
        preview: trimmed.length > 100 ? trimmed.substring(0, 100) + "…" : trimmed,
        date: dateStr,
        time: timeStr,
        frameIndex: nextFrameIndex,
        summary,
        tags,
        wordCount,
        type: "text",
        status: "saved",
        createdAt: iso,
        updatedAt: iso,
      };

      onSave(frame);
      setIsDeveloping(false);
    }, 600);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isMobile) return;
    const target = e.target as HTMLElement;
    if (target.closest("textarea") || target.closest("[data-sticky-save]")) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const showStickyBar = isMobile && isFocused && (draftText.trim().length > 0 || isDeveloping);

  return (
    <div className="flex flex-1 flex-col" onClick={handleContainerClick}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="mb-12 mt-6 text-center"
      >
        <h1 className="text-xl font-medium tracking-widest text-text-primary">
          镜隙之间
        </h1>
        <p className="mt-2 text-xs tracking-[0.2em] text-text-muted">
          让时间慢慢显影
        </p>
      </motion.header>

      {/* Memory input — the main visual */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="mb-6"
      >
        <MemoryInput
          value={draftText}
          onChange={onDraftChange}
          onSave={handleSave}
          nextFrameNumber={nextFrameIndex}
          isDeveloping={isDeveloping}
          onFocusChange={handleFocusChange}
        />
      </motion.div>

      {/* Subtle film archive entry — only when idle and empty */}
      {!draftText.trim() && !isFocused && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          onClick={onViewFilm}
          className="mb-4 flex items-center justify-center gap-0.5 text-xs tracking-wider text-text-muted/25 transition-colors hover:text-text-muted/50"
        >
          查看时间胶片
          {todayFrameCount > 0 && (
            <span className="ml-1">
              · 今日 {todayFrameCount} 帧
            </span>
          )}
          <ChevronRight size={11} />
        </motion.button>
      )}

      {/* Action bar — desktop only, mobile uses sticky bar */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="mb-6"
        >
          <ActionBar text={draftText} onSave={handleSave} isDeveloping={isDeveloping} />
        </motion.div>
      )}

      {/* Bottom safe area — keep content away from gesture zone */}
      <div className="flex-1 min-h-[48px]" />

      {/* Mobile sticky save bar — reuses ActionBar for consistent design */}
      {showStickyBar && (
        <div
          data-sticky-save
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-soft px-4 pt-3"
          style={{
            paddingBottom: "env(safe-area-inset-bottom, 16px)",
            background: "var(--bg-base)",
          }}
        >
          <ActionBar text={draftText} onSave={handleSave} isDeveloping={isDeveloping} />
        </div>
      )}
    </div>
  );
}
