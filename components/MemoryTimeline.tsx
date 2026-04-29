"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MemoryFrame, TimeScale } from "@/data/demoFrames";
import MemoryCard from "./MemoryCard";
import MemoryCardSkeleton from "./MemoryCardSkeleton";
import TimelineRail from "./TimelineRail";
import DaySummaryCard from "./DaySummaryCard";
import useIsMobile from "@/hooks/useIsMobile";

type AggregatedData =
  | { type: "year"; data: { year: string; frameCount: number; topTags: string[]; recentFrames: MemoryFrame[] }[] }
  | { type: "month"; data: { yearMonth: string; year: string; month: string; frameCount: number; activeDays: number; topTags: string[]; recentFrames: MemoryFrame[] }[] }
  | { type: "day"; data: { date: string; frameCount: number; topTags: string[]; frames: MemoryFrame[] }[] }
  | { type: "fragment"; data: { frames: MemoryFrame[] } };

type Props = {
  timeScale: TimeScale;
  data: AggregatedData;
  onFrameClick: (frame: MemoryFrame) => void;
  isLoading?: boolean;
};

export default function MemoryTimeline({
  timeScale,
  data,
  onFrameClick,
  isLoading = false,
}: Props) {
  const isMobile = useIsMobile();
  return (
    <div className="flex-1">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {[1, 2, 3].map((i) => (
              <MemoryCardSkeleton key={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={timeScale + JSON.stringify(data)}
            initial={{ opacity: 0, filter: isMobile ? "blur(1px)" : "blur(3px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(1px)" }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Year view */}
            {timeScale === "year" && data.type === "year" && (
              <div className="space-y-6">
                {data.data.map((y, i) => (
                  <motion.div
                    key={y.year}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    className="border border-border-subtle bg-bg-card px-5 py-5"
                    style={{ borderRadius: "6px" }}
                  >
                    <div className="mb-2 font-mono text-lg font-medium text-text-primary">
                      {y.year}
                    </div>
                    <p className="mb-3 text-sm text-text-secondary">
                      记录 {y.frameCount} 帧
                    </p>
                    {y.topTags.length > 0 && (
                      <p className="mb-3 text-xs text-text-muted">
                        高频词：{y.topTags.join(" / ")}
                      </p>
                    )}
                    {y.recentFrames.length > 0 && (
                      <div className="border-t border-border-soft pt-3">
                        <p className="mb-2 text-[10px] text-text-muted/50">最近片段</p>
                        {y.recentFrames.map((f) => (
                          <p key={f.id} className="truncate text-xs leading-relaxed text-text-muted/70">
                            {f.content.length > 40 ? f.content.substring(0, 40) + "…" : f.content}
                          </p>
                        ))}
                        {y.frameCount > 3 && (
                          <p className="mt-1 text-[10px] text-text-muted/30">还有 {y.frameCount - 3} 帧</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Month view */}
            {timeScale === "month" && data.type === "month" && (
              <div className="space-y-6">
                {data.data.map((m, i) => (
                  <motion.div
                    key={m.yearMonth}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    className="border border-border-subtle bg-bg-card px-5 py-5"
                    style={{ borderRadius: "6px" }}
                  >
                    <div className="mb-2 font-mono text-base font-medium text-text-primary">
                      {m.year}年{m.month}月
                    </div>
                    <p className="mb-2 text-sm text-text-secondary">
                      共 {m.frameCount} 帧 · 活跃 {m.activeDays} 天
                    </p>
                    {m.topTags.length > 0 && (
                      <p className="mb-3 text-xs text-text-muted">
                        关键词：{m.topTags.join(" / ")}
                      </p>
                    )}
                    {m.recentFrames.length > 0 && (
                      <div className="border-t border-border-soft pt-3">
                        <p className="mb-2 text-[10px] text-text-muted/50">最近片段</p>
                        {m.recentFrames.map((f) => (
                          <p key={f.id} className="truncate text-xs leading-relaxed text-text-muted/70">
                            {f.content.length > 50 ? f.content.substring(0, 50) + "…" : f.content}
                          </p>
                        ))}
                        {m.frameCount > 3 && (
                          <p className="mt-1 text-[10px] text-text-muted/30">还有 {m.frameCount - 3} 帧</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Day view — one group per date, each with summary card + memory cards */}
            {timeScale === "day" && data.type === "day" && (
              <div className="space-y-10">
                {data.data.map((day, di) => (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: di * 0.06, duration: 0.5 }}
                  >
                    <DaySummaryCard
                      date={day.date}
                      frameCount={day.frameCount}
                      topTags={day.topTags}
                    />

                    <div className="relative pl-12">
                      <TimelineRail frames={day.frames} />
                      <div className="space-y-4">
                        {day.frames.map((frame, fi) => (
                          <MemoryCard
                            key={frame.id}
                            frame={frame}
                            index={fi}
                            onClick={() => onFrameClick(frame)}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Fragment view — with timeline rail */}
            {timeScale === "fragment" && data.type === "fragment" && (
              <div className="relative pl-12">
                <TimelineRail frames={data.data.frames} />
                <div className="space-y-4">
                  {data.data.frames.map((frame, i) => (
                    <MemoryCard
                      key={frame.id}
                      frame={frame}
                      index={i}
                      onClick={() => onFrameClick(frame)}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
