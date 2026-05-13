"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { MemoryFrame } from "@/data/demoFrames";
import { createFrame } from "@/src/domain/frame/createFrame";
import { contentHash } from "@/services/ai/types";
import { getAiProvider } from "@/services/ai";
import { track } from "@/lib/analytics";
import { createSafeId } from "@/src/lib/id/createSafeId";
import useIsMobile from "@/hooks/useIsMobile";
import useFirstVisitHint from "@/hooks/useFirstVisitHint";
import MemoryInput from "./MemoryInput";
import ActionBar from "./ActionBar";

type Props = {
  draftText: string;
  onDraftChange: (text: string) => void;
  onDraftClear: () => void;
  onSave: (frame: MemoryFrame) => void;
  onUpdateFrame: (id: string, changes: Partial<Pick<MemoryFrame, "summary" | "tags" | "tone" | "ai">>) => void;
  onViewFilm: () => void;
  onOpenDataManager: () => void;
  todayFrameCount: number;
  nextFrameIndex: number;
  showToast: (message: string) => void;
  frames: MemoryFrame[];
};

export default function RecordingRoom({ draftText, onDraftChange, onDraftClear, onSave, onUpdateFrame, onViewFilm, onOpenDataManager, todayFrameCount, nextFrameIndex, showToast, frames }: Props) {
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const framesRef = useRef(frames);
  framesRef.current = frames;
  const isMobile = useIsMobile();
  const { isFirstVisit, completeFirstVisit } = useFirstVisitHint();

  // Auto-complete first visit when user starts typing
  useEffect(() => {
    if (isFirstVisit && draftText.trim().length > 0) {
      completeFirstVisit();
    }
  }, [draftText, isFirstVisit, completeFirstVisit]);

  const showHint = isFirstVisit && !draftText.trim();

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
    if (!draftText.trim()) {
      showToast("先写下些什么吧");
      return;
    }
    if (isDeveloping) return;

    setIsDeveloping(true);
    const content = draftText;
    const hash = contentHash(content);
    const requestId = createSafeId("develop");

    // Save immediately at 650ms (animation settle point), then run AI in background
    setTimeout(async () => {
      let frameWithAi: MemoryFrame;

      try {
        const frame = createFrame({ content, frameIndex: nextFrameIndex });
        frameWithAi = {
          ...frame,
          ai: {
            provider: "mock" as const,
            generatedAt: new Date().toISOString(),
            version: "v0.7",
            contentHash: hash,
            requestId,
            requestedAt: new Date().toISOString(),
          },
        };

        onSave(frameWithAi);
      } catch {
        setIsDeveloping(false);
        showToast("保存失败，请重试");
        return;
      }

      setIsDeveloping(false);

      // Per-frame guard: uses ref to always read latest frames state
      const isFrameValid = (id: string, reqId: string): boolean => {
        const current = framesRef.current.find((f) => f.id === id);
        if (!current) return false;
        if (current.deletedAt) return false;
        if (current.ai?.requestId && current.ai.requestId !== reqId) return false;
        return true;
      };

      // Background AI — never blocks the save
      try {
        const res = await fetch("/api/ai/develop-frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, createdAt: frameWithAi.createdAt }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!isFrameValid(frameWithAi.id, requestId)) return;
          track("frame_developed");
          onUpdateFrame(frameWithAi.id, {
            summary: data.summary || "",
            tags: data.tags || [],
            tone: data.tone || "平静",
            ai: {
              provider: data.provider || "mock",
              model: data.model,
              generatedAt: new Date().toISOString(),
              version: "v0.7",
              contentHash: hash,
              requestId,
              requestedAt: frameWithAi.ai?.requestedAt,
              completedAt: new Date().toISOString(),
            },
          });
          return;
        }
      } catch { /* fall through to mock */ }

      // Mock fallback in background
      if (!isFrameValid(frameWithAi.id, requestId)) return;
      try {
        const provider = getAiProvider();
        const mockResult = await provider.processFrame({ content });
        onUpdateFrame(frameWithAi.id, {
          summary: mockResult.summary || "",
          tags: mockResult.tags || [],
          tone: mockResult.tone || "平静",
          ai: {
            provider: "mock",
            generatedAt: new Date().toISOString(),
            version: "v0.7",
            contentHash: hash,
            requestId,
            requestedAt: frameWithAi.ai?.requestedAt,
            completedAt: new Date().toISOString(),
            fallbackUsed: true,
          },
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

  // Entrance animation: full stagger on first visit, instant on return
  const fadeUp = (delay: number) =>
    isFirstVisit
      ? {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] as const },
        }
      : { initial: false as const, animate: { opacity: 1, y: 0 } };

  return (
    <div className="flex flex-1 flex-col" onClick={handleContainerClick}>
      {/* Header */}
      <header className="mb-12 mt-6 text-center">
        <motion.h1
          {...fadeUp(0)}
          className="font-serif text-xl font-medium tracking-widest text-text-primary"
        >
          镜隙之间
        </motion.h1>
        <motion.p
          {...fadeUp(0.12)}
          className="mt-2 font-serif text-xs italic tracking-wide text-text-muted"
        >
          让时间慢慢显影
        </motion.p>
      </header>

      {/* Memory input — the main visual */}
      <motion.div
        {...fadeUp(0.28)}
        className="mb-6"
      >
        <MemoryInput
          value={draftText}
          onChange={onDraftChange}
          onSave={handleSave}
          nextFrameNumber={nextFrameIndex}
          isDeveloping={isDeveloping}
          onFocusChange={setIsFocused}
          showHint={showHint}
        />
      </motion.div>

      {/* Film archive entry — fades when typing or focused */}
      <motion.button
        {...fadeUp(0.5)}
        onClick={onViewFilm}
        className="mb-4 flex items-center justify-center gap-0.5 text-xs tracking-wider max-w-full min-w-0 transition-all duration-300 hover:text-text-muted/60"
        style={{
          color: (draftText.trim() || isFocused)
            ? "color-mix(in srgb, var(--text-primary) 12%, transparent)"
            : "color-mix(in srgb, var(--text-primary) 25%, transparent)",
          pointerEvents: isFocused && !isMobile ? "none" : "auto",
        }}
      >
        <span className="truncate">查看时间胶片</span>
        {todayFrameCount > 0 && (
          <span className="shrink-0">
            · 今日 {todayFrameCount} 帧
          </span>
        )}
        <ChevronRight size={11} className="shrink-0" />
      </motion.button>

      {/* Data management entry */}
      <motion.button
        {...fadeUp(0.55)}
        onClick={onOpenDataManager}
        className="mb-4 flex items-center justify-center text-xs tracking-wider max-w-full transition-colors duration-300 hover:text-text-muted/60"
        style={{ color: "color-mix(in srgb, var(--text-primary) 14%, transparent)" }}
      >
        数据管理
      </motion.button>

      {/* Action bar — desktop only, mobile uses sticky bar */}
      {!isMobile && (
        <motion.div
          {...fadeUp(0.48)}
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
