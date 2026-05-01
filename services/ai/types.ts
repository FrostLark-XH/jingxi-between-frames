// ── AI service types ─────────────────────────────────────────────────────

export type AiProviderType = "mock" | "openai" | "custom";
export type AiProviderName = "mock" | "real";

export type FrameInput = {
  content: string;
};

export type FrameAiOutput = {
  summary: string;
  tags: string[];
  keywords?: string[];
  tone?: string;
  provider?: AiProviderName;
  model?: string;
};

export type DaySummaryInput = {
  date: string;
  frames: {
    time: string;
    content: string;
    summary: string;
    tags: string[];
  }[];
};

export type DaySummaryOutput = {
  mainline: string;
  keywords: string[];
  reviewHint: string;
  provider: AiProviderName;
  model?: string;
};

export type FrameAiMetadata = {
  provider: AiProviderName;
  model?: string;
  generatedAt: string;
  version: string;
  contentHash: string;
};

export interface AiProvider {
  readonly type: AiProviderType;
  processFrame(input: FrameInput): Promise<FrameAiOutput>;
}

export interface DaySummaryProvider {
  summarizeDay(input: DaySummaryInput): Promise<DaySummaryOutput>;
}

// Simple hash for content change detection — no heavy deps
export function contentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const chr = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(36);
}

// Check whether AI metadata is stale (content changed since last generation)
export function isAiStale(content: string, ai?: { contentHash?: string }): boolean {
  if (!ai?.contentHash) return true;
  return ai.contentHash !== contentHash(content);
}
