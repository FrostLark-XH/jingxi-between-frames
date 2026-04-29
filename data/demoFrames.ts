export type MemoryFrame = {
  id: string;
  content: string;
  preview: string;
  summary: string;
  tags: string[];
  date: string;
  time: string;
  frameIndex: number;
  wordCount: number;
  duration?: string;
  type: "text" | "voice";
  status: "saved" | "organizing" | "developing";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type TimeScale = "year" | "month" | "day" | "fragment";

export function formatFrameNumber(index: number): string {
  return index.toString().padStart(2, "0");
}

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
}

export const demoFrames: MemoryFrame[] = [];

// ── Utility functions ────────────────────────────────────────────────────

export function getFramesByDate(frames: MemoryFrame[], date: string) {
  return frames.filter((f) => f.date === date);
}

export function getFramesByYearMonth(
  frames: MemoryFrame[],
  year: string,
  month?: string
) {
  return frames.filter((f) => {
    const [y, m] = f.date.split(".");
    if (month) return y === year && m === month;
    return y === year;
  });
}

export function getAggregatedYearData(frames: MemoryFrame[]) {
  const years = new Set(frames.map((f) => f.date.split(".")[0]));
  return Array.from(years)
    .sort((a, b) => b.localeCompare(a))
    .map((year) => {
      const yearFrames = getFramesByYearMonth(frames, year);
      const allTags = yearFrames.flatMap((f) => f.tags);
      const tagCounts = allTags.reduce<Record<string, number>>((acc, t) => {
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([t]) => t);
      const recentFrames = [...yearFrames]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3);

      return { year, frameCount: yearFrames.length, topTags, recentFrames };
    });
}

export function getAggregatedMonthData(frames: MemoryFrame[]) {
  const months = new Set(
    frames.map((f) => f.date.substring(0, 7))
  );
  return Array.from(months)
    .sort((a, b) => b.localeCompare(a))
    .map((ym) => {
      const [y, m] = ym.split(".");
      const monthFrames = getFramesByYearMonth(frames, y, m);
      const allTags = monthFrames.flatMap((f) => f.tags);
      const tagCounts = allTags.reduce<Record<string, number>>((acc, t) => {
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([t]) => t);
      const activeDays = new Set(monthFrames.map((f) => f.date)).size;
      const recentFrames = [...monthFrames]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3);

      return { yearMonth: ym, year: y, month: m, frameCount: monthFrames.length, activeDays, topTags, recentFrames };
    });
}

export function getAggregatedDayData(frames: MemoryFrame[]) {
  const dates = new Set(frames.map((f) => f.date));
  return Array.from(dates)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => {
      const dayFrames = getFramesByDate(frames, date);
      const allTags = dayFrames.flatMap((f) => f.tags);
      const uniqueTags = [...new Set(allTags)].slice(0, 5);

      return { date, frameCount: dayFrames.length, topTags: uniqueTags, frames: dayFrames };
    });
}
