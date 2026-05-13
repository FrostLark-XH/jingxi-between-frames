export type TimeScale = "year" | "month" | "day";

export function formatFrameNumber(index: number): string {
  return index.toString().padStart(2, "0");
}

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
}
