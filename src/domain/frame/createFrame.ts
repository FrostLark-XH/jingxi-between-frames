import type { MemoryFrame } from "@/src/domain/frame/types";
import { getTodayDateString } from "@/src/domain/time/timescale";
import { createSafeId } from "@/src/lib/id/createSafeId";

export type CreateFrameInput = {
  content: string;
  frameIndex: number;
  type?: "text" | "voice";
  duration?: string;
};

export function createFrame(input: CreateFrameInput): MemoryFrame {
  const now = new Date();
  const date = getTodayDateString();
  const raw = input.content;
  const preview = raw.length > 100 ? raw.substring(0, 100) + "…" : raw;

  return {
    id: createSafeId("frame"),
    content: raw,
    rawContent: raw,
    preview,
    summary: "",
    tags: [],
    tone: undefined,
    ai: undefined,
    developed: undefined,
    date,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    frameIndex: input.frameIndex,
    wordCount: raw.length,
    type: input.type ?? "text",
    duration: input.duration,
    status: "saved",
    frameStatus: "active",
    developStatus: "idle",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
