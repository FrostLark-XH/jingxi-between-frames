// ── AI output type guards — runtime validation without zod ───────────────
// Every AI response passes through these before touching application state.
// Returns null for invalid input (triggers fallback).

import type { FrameAiOutput, ReflectionStoryOutput } from "@/services/ai/types";

export function validateFrameAiOutput(data: unknown): FrameAiOutput | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  if (typeof d.summary !== "string") return null;
  if (!Array.isArray(d.tags) || !d.tags.every((t: unknown) => typeof t === "string")) return null;
  if (d.tone !== undefined && typeof d.tone !== "string") return null;

  return {
    summary: d.summary,
    tags: d.tags as string[],
    tone: typeof d.tone === "string" ? d.tone : undefined,
    provider: typeof d.provider === "string" ? (d.provider as FrameAiOutput["provider"]) : undefined,
    model: typeof d.model === "string" ? d.model : undefined,
  };
}

export function validateReflectionOutput(data: unknown): ReflectionStoryOutput | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  if (typeof d.story !== "string") return null;
  if (!Array.isArray(d.floatingWords) || !d.floatingWords.every((w: unknown) => typeof w === "string")) return null;
  if (!Array.isArray(d.motifs) || !d.motifs.every((m: unknown) => typeof m === "string")) return null;
  if (!Array.isArray(d.mood) || !d.mood.every((m: unknown) => typeof m === "string")) return null;
  if (typeof d.basedOnCount !== "number") return null;

  return {
    title: typeof d.title === "string" ? d.title : undefined,
    story: d.story,
    floatingWords: d.floatingWords as string[],
    motifs: d.motifs as string[],
    mood: d.mood as string[],
    basedOnCount: d.basedOnCount,
    generatedAt: typeof d.generatedAt === "number" ? d.generatedAt : Date.now(),
    provider: typeof d.provider === "string" ? (d.provider as ReflectionStoryOutput["provider"]) : "mock",
    model: typeof d.model === "string" ? d.model : undefined,
  };
}
