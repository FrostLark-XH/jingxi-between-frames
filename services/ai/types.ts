// ── AI service types ─────────────────────────────────────────────────────

export type AiProviderType = "mock" | "openai" | "custom";
export type AiProviderName = "mock" | "real";

export type FrameInput = {
  content: string;
};

export type FrameAiOutput = {
  summary: string;
  tags: string[];
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
  themes: string[];
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
  /** UUID to detect stale AI responses for the same frame */
  requestId?: string;
  /** ISO timestamp when AI was requested */
  requestedAt?: string;
  /** ISO timestamp when AI completed */
  completedAt?: string;
  /** True if the primary provider failed and mock fallback was used */
  fallbackUsed?: boolean;
  /** Error message from the failed primary attempt */
  error?: string;
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

// ── Reflection types — "镜中人" story generation ────────────────────────

export type ReflectionInput = {
  frames: {
    date: string;
    time: string;
    content: string;
    summary: string;
    tags: string[];
    tone?: string;
  }[];
};

/** "镜子另一边" 旧结构 — version 1，仅保留用于缓存兼容检测 */
export type ReflectionOutput = {
  body: string;
  floatingWords: string[];
  generatedAt: number;
  frameCount: number;
  spanDays: number;
  provider: AiProviderName;
  model?: string;
};

/** 旧缓存结构（version 1，已废弃） */
export type ReflectionCacheV1 = ReflectionOutput & {
  version: 1;
};

/** "镜中人" 新结构 — version 2 */
export type ReflectionStoryOutput = {
  title?: string;
  story: string;
  floatingWords: string[];
  motifs: string[];
  mood: string[];
  basedOnCount: number;
  generatedAt: number;
  provider: AiProviderName;
  model?: string;
};

/** 新缓存结构 */
export type ReflectionCache = ReflectionStoryOutput & {
  version: 2;
};
