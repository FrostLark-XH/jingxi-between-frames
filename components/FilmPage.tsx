"use client";

import { motion } from "framer-motion";
import { useEffect, memo } from "react";
import { ArrowLeft } from "lucide-react";
import { MemoryFrame, TimeScale } from "@/data/demoFrames";
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
  onUpdate: (id: string, changes: Partial<Pick<MemoryFrame, "content" | "tags" | "summary">>) => void;
  onRestore: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
  onBack: () => void;
  onArchiveOpenChange?: (open: boolean) => void;
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
  onArchiveOpenChange,
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
      <motion.header
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center justify-between"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm tracking-wider text-text-muted/70 transition-colors hover:text-text-secondary"
        >
          <ArrowLeft size={14} />
          <span>返回记录室</span>
        </button>
        <div className="flex items-center gap-4 pr-4 sm:pr-12">
          {deletedFrames.length > 0 && (
            <RecycleBin
              deletedFrames={deletedFrames}
              onRestore={onRestore}
              onPermanentlyDelete={onPermanentlyDelete}
            />
          )}
          <ArchivePanel frames={frames} onOpenChange={onArchiveOpenChange} />
          <span className="text-xs tracking-[0.15em] text-text-muted/50">
            时间胶片
          </span>
        </div>
      </motion.header>

      {/* Time scale switcher */}
      <motion.div
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-6"
      >
        <TimeScaleSwitcher current={effectiveScale} onChange={onTimeScaleChange} totalFrameCount={totalFrameCount} />
      </motion.div>

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
      <FrameDetailOverlay frame={selectedFrame} onClose={onFrameClose} onDelete={onDelete} onUpdate={onUpdate} />
    </div>
  );
});
