// ── AI service layer — unified entry point ────────────────────────────────
// Components call getAiProvider() for frame developing and
// getDaySummaryProvider() for daily mainline generation.
//
// Real provider is server-only (API key); mock provider is the universal
// fallback. API Routes orchestrate real → mock fallback.

import {
  AiProvider,
  DaySummaryProvider,
  FrameAiOutput,
  ReflectionInput,
  ReflectionStoryOutput,
} from "./types";
import { mockAiProvider } from "./mockProvider";
import { mockReflectionProvider } from "./reflectionProvider";

export type {
  AiProvider,
  DaySummaryProvider,
  AiProviderType,
  AiProviderName,
  FrameInput,
  FrameAiOutput,
  DaySummaryInput,
  DaySummaryOutput,
  FrameAiMetadata,
  ReflectionInput,
  ReflectionOutput,
  ReflectionCacheV1,
  ReflectionStoryOutput,
  ReflectionCache,
} from "./types";
export { contentHash } from "./types";

/** Clean common LLM punctuation errors from generated text. */
function sanitizeText(text: string): string {
  return text
    .replace(/。，/g, "，")
    .replace(/，。/g, "。")
    .replace(/。。/g, "。")
    .replace(/，，/g, "，")
    .replace(/！，/g, "，")
    .replace(/？，/g, "，")
    .replace(/。、/g, "、")
    .replace(/，、/g, "、");
}

function sanitizeOutput(output: FrameAiOutput): FrameAiOutput {
  return {
    ...output,
    summary: sanitizeText(output.summary),
    tags: output.tags.map(sanitizeText),
  };
}

// Client-safe: always returns mock. Real provider is server-only.
export function getAiProvider(): AiProvider & DaySummaryProvider {
  return mockAiProvider;
}

// Server-only entry for API Routes.
// Dynamic import so realProvider never lands in client bundles.
export async function getDevelopFrameResult(
  content: string,
  createdAt: string
): Promise<FrameAiOutput> {
  try {
    const { developFrameReal } = await import("./realProvider");
    const result = await developFrameReal(content, createdAt);
    return sanitizeOutput(result);
  } catch {
    const result = await mockAiProvider.processFrame({ content });
    return sanitizeOutput({ ...result, provider: "mock" });
  }
}

export async function getDaySummaryResult(
  input: Parameters<typeof mockAiProvider.summarizeDay>[0]
): Promise<ReturnType<typeof mockAiProvider.summarizeDay>> {
  try {
    const { summarizeDayReal } = await import("./realProvider");
    return await summarizeDayReal(input);
  } catch {
    return mockAiProvider.summarizeDay(input);
  }
}

export async function getReflectionResult(
  input: ReflectionInput
): Promise<ReflectionStoryOutput> {
  try {
    const { reflectReal } = await import("./realProvider");
    return await reflectReal(input);
  } catch {
    return mockReflectionProvider.reflect(input);
  }
}
