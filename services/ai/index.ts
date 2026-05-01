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
} from "./types";
import { mockAiProvider } from "./mockProvider";

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
} from "./types";
export { contentHash } from "./types";

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
    return await developFrameReal(content, createdAt);
  } catch {
    const result = await mockAiProvider.processFrame({ content });
    return { ...result, provider: "mock" };
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
