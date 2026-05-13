// Re-exports from domain/storage modules — backward compatibility
// New code should import directly from:
//   @/src/domain/frame/types     → MemoryFrame
//   @/src/domain/frame/createFrame → createFrame
//   @/src/domain/time/timescale  → TimeScale, formatFrameNumber, getTodayDateString
//   @/src/domain/time/groupFrames → getFramesByDate, getAggregatedDayData, etc.

export type { MemoryFrame, DevelopedData } from "@/src/domain/frame/types";
export type { TimeScale } from "@/src/domain/time/timescale";
export { formatFrameNumber, getTodayDateString } from "@/src/domain/time/timescale";
export {
  getFramesByDate,
  getFramesByYearMonth,
  getAggregatedYearData,
  getAggregatedMonthData,
  getAggregatedDayData,
} from "@/src/domain/time/groupFrames";

export const demoFrames: import("@/src/domain/frame/types").MemoryFrame[] = [];
