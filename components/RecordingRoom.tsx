"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { MemoryFrame } from "@/data/demoFrames";
import { contentHash } from "@/services/ai/types";
import { getAiProvider } from "@/services/ai";
import { formatText } from "@/lib/textFormat";
import useIsMobile from "@/hooks/useIsMobile";
import MemoryInput from "./MemoryInput";
import ActionBar from "./ActionBar";

type Props = {
  draftText: string;
  onDraftChange: (text: string) => void;
  onDraftClear: () => void;
  onSave: (frame: MemoryFrame) => void;
  onUpdateFrame: (id: string, changes: Partial<Pick<MemoryFrame, "summary" | "tags" | "tone" | "ai">>) => void;
  onViewFilm: () => void;
  todayFrameCount: number;
  nextFrameIndex: number;
  showToast: (message: string) => void;
};

export default function RecordingRoom({ draftText, onDraftChange, onDraftClear, onSave, onUpdateFrame, onViewFilm, todayFrameCount, nextFrameIndex, showToast }: Props) {
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isMobile = useIsMobile();

  // Track iOS keyboard height via Visual Viewport API so the sticky bar
  // sits above the keyboard instead of behind it.
  useEffect(() => {
    if (!isMobile) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const measure = () => {
      const gap = window.innerHeight - (vv.offsetTop + vv.height);
      setKeyboardHeight(gap > 60 ? gap : 0);
    };

    vv.addEventListener("resize", measure);
    vv.addEventListener("scroll", measure);
    measure();

    return () => {
      vv.removeEventListener("resize", measure);
      vv.removeEventListener("scroll", measure);
    };
  }, [isMobile]);

  const handleSave = async () => {
    // Validate before formatting — formatText("   ") would still be non-empty
    if (!draftText.trim()) {
      showToast("先写下些什么吧");
      return;
    }
    if (isDeveloping) return;

    const formatted = formatText(draftText);

    setIsDeveloping(true);

    // Save immediately at 650ms (animation settle point), then run AI in background
    setTimeout(async () => {
      const now = new Date();
      const iso = now.toISOString();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const wordCount = formatted.length;
      const hash = contentHash(formatted);

      const frameId = `frame-${Date.now()}`;
      const frame: MemoryFrame = {
        id: frameId,
        content: formatted,
        preview: formatted.length > 100 ? formatted.substring(0, 100) + "…" : formatted,
        date: dateStr,
        time: timeStr,
        frameIndex: nextFrameIndex,
        summary: "",
        tags: [],
        tone: "平静",
        wordCount,
        type: "text",
        status: "saved",
        createdAt: iso,
        updatedAt: iso,
        ai: { provider: "mock", generatedAt: iso, version: "v0.6", contentHash: hash },
      };

      onSave(frame);
      setIsDeveloping(false);

      // Background AI — never blocks the save
      try {
        const res = await fetch("/api/ai/develop-frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: formatted, createdAt: iso }),
        });
        if (res.ok) {
          const data = await res.json();
          onUpdateFrame(frameId, {
            summary: data.summary || "",
            tags: data.tags || [],
            tone: data.tone || "平静",
            ai: {
              provider: data.provider || "mock",
              model: data.model,
              generatedAt: new Date().toISOString(),
              version: "v0.6",
              contentHash: hash,
            },
          });
          return;
        }
      } catch { /* fall through to mock */ }

      // Mock fallback in background
      try {
        const provider = getAiProvider();
        const mockResult = await provider.processFrame({ content: formatted });
        onUpdateFrame(frameId, {
          summary: mockResult.summary || "",
          tags: mockResult.tags || [],
          tone: mockResult.tone || "平静",
        });
      } catch { /* silent — frame is already saved */ }
    }, 650);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isMobile) return;
    const target = e.target as HTMLElement;
    if (target.closest("textarea") || target.closest("[data-sticky-save]")) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const showStickyBar = isMobile && (draftText.trim().length > 0 || isDeveloping);

  return (
    <div className="flex flex-1 flex-col" onClick={handleContainerClick}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="mb-12 mt-6 text-center"
      >
        <h1 className="font-serif text-xl font-medium tracking-widest text-text-primary">
          镜隙之间
        </h1>
        <p className="mt-2 font-serif text-xs italic tracking-wide text-text-muted">
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
          onFocusChange={setIsFocused}
        />
      </motion.div>

      {/* Film archive entry — fades when typing or focused */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        onClick={onViewFilm}
        className="mb-4 flex items-center justify-center gap-0.5 text-xs tracking-wider transition-all duration-300 hover:text-text-muted/60"
        style={{
          color: (draftText.trim() || isFocused)
            ? "color-mix(in srgb, var(--text-primary) 12%, transparent)"
            : "color-mix(in srgb, var(--text-primary) 25%, transparent)",
          pointerEvents: isFocused ? "none" : "auto",
        }}
      >
        查看时间胶片
        {todayFrameCount > 0 && (
          <span className="ml-1">
            · 今日 {todayFrameCount} 帧
          </span>
        )}
        <ChevronRight size={11} />
      </motion.button>

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
          className="fixed left-0 right-0 z-50 border-t border-border-soft px-4 pt-3 bg-bg-base"
          style={{
            bottom: keyboardHeight,
            paddingBottom: keyboardHeight > 0 ? 12 : "env(safe-area-inset-bottom, 16px)",
            transition: "bottom 0.25s ease-out",
          }}
        >
          <ActionBar text={draftText} onSave={handleSave} isDeveloping={isDeveloping} />
        </div>
      )}
    </div>
  );
}
