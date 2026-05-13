"use client";

import { motion } from "framer-motion";
import { useEffect, memo } from "react";
import { MemoryFrame, TimeScale } from "@/data/demoFrames";
import AppHeader from "./AppHeader";
import TimeScaleSwitcher from "./TimeScaleSwitcher";
import MemoryTimeline from "./MemoryTimeline";
import FrameDetailOverlay from "./FrameDetailOverlay";
import EmptyState from "./EmptyState";
import RecycleBin from "./RecycleBin";
import ArchivePanel from "./ArchivePanel";

type AggregatedData =
  | { type: "year"; data: { year: string; frameCount: number; topTags: string[]; recentFrames: MemoryFrame[] }[] }
  | { type: "month"; data: { yearMonth: string; year: string; month: string; frameCount: number; activeDays: number; topTags: string[]; recentFrames: MemoryFrame[] }[] }
  | { type: "day"; data: { date: string; frameCount: number; topTags: string[]; frames: MemoryFrame[] }[] };

type Props = {
  timeScale: TimeScale;
  aggregatedData: AggregatedData;
  selectedFrame: MemoryFrame | null;
  deletedFrames: MemoryFrame[];
  frames: MemoryFrame[];
  totalFrameCount: number;
  onTimeScaleChange: (scale: TimeScale) => void;
  onFrameClick: (frame: MemoryFrame) => void;
  onFrameClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Pick<MemoryFrame, "content" | "tags" | "summary" | "tone" | "ai">>) => void;
  onRestore: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
  onBack: () => void;
  onOpenDataManager: () => void;
  onOpenReflection: () => void;
  onArchiveOpenChange?: (open: boolean) => void;
  showToast: (message: string) => void;
};

export default memo(function FilmPage({
  timeScale,
  aggregatedData,
  selectedFrame,
  deletedFrames,
  frames,
  totalFrameCount,
  onTimeScaleChange,
  onFrameClick,
  onFrameClose,
  onDelete,
  onUpdate,
  onRestore,
  onPermanentlyDelete,
  onBack,
  onOpenDataManager,
  onOpenReflection,
  onArchiveOpenChange,
  showToast,
}: Props) {
  const hasData =
    aggregatedData.type === "year"
      ? aggregatedData.data.length > 0
      : aggregatedData.type === "month"
        ? aggregatedData.data.length > 0
        : aggregatedData.data.length > 0;

  // Ensure current scale is available; fall back to "day" if not
  const scaleMinFrames: Record<TimeScale, number> = { year: 30, month: 10, day: 0 };
  const effectiveScale = totalFrameCount >= scaleMinFrames[timeScale] ? timeScale : "day";

  useEffect(() => {
    if (effectiveScale !== timeScale) {
      onTimeScaleChange("day");
    }
  }, [effectiveScale, timeScale, onTimeScaleChange]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <AppHeader
        title="时间胶片"
        onBack={onBack}
        backLabel="返回记录室"
        mobilePrimaryAction={<ArchivePanel frames={frames} onOpenChange={onArchiveOpenChange} />}
      >
        <button
          onClick={onOpenDataManager}
          className="whitespace-nowrap shrink-0 text-xs tracking-wider text-text-muted/40 hover:text-text-muted/70 transition-colors min-h-[44px] flex items-center"
        >
          数据管理
        </button>
        {deletedFrames.length > 0 && (
          <RecycleBin
            deletedFrames={deletedFrames}
            onRestore={onRestore}
            onPermanentlyDelete={onPermanentlyDelete}
          />
        )}
        <div className="hidden sm:block">
          <ArchivePanel frames={frames} onOpenChange={onArchiveOpenChange} />
        </div>
      </AppHeader>

      {/* Time scale switcher */}
      <motion.div
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-6"
      >
        <TimeScaleSwitcher current={effectiveScale} onChange={onTimeScaleChange} totalFrameCount={totalFrameCount} />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: totalFrameCount >= 3 ? 0.48 : 0.24, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
        onClick={totalFrameCount >= 3 ? onOpenReflection : undefined}
        disabled={totalFrameCount < 3}
        className="group mx-auto mb-7 flex min-h-[36px] items-center justify-center gap-3 px-4 font-serif text-xs tracking-[0.12em] text-text-muted transition-opacity hover:opacity-80 disabled:cursor-default disabled:hover:opacity-25"
      >
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-border-soft opacity-35" />
        <span className="transition-colors group-hover:text-text-secondary">
          {totalFrameCount >= 3 ? "镜中似乎映出了些什么 →" : "再多几帧，镜中会浮出些什么"}
        </span>
        <span className="h-px w-8 bg-gradient-to-l from-transparent to-border-soft opacity-35" />
      </motion.button>

      {/* Timeline or empty */}
      {hasData ? (
        <MemoryTimeline
          timeScale={effectiveScale}
          data={aggregatedData}
          onFrameClick={onFrameClick}
        />
      ) : (
        <EmptyState onNewRecord={onBack} />
      )}

      {/* Detail overlay */}
      <FrameDetailOverlay frame={selectedFrame} onClose={onFrameClose} onDelete={onDelete} onUpdate={onUpdate} showToast={showToast} />
    </div>
  );
});
