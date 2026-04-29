// ── AI service types ─────────────────────────────────────────────────────

export type AiProviderType = "mock" | "openai" | "custom";

export type FrameInput = {
  content: string;
};

export type FrameAiOutput = {
  summary: string;
  tags: string[];
};

export interface AiProvider {
  readonly type: AiProviderType;
  processFrame(input: FrameInput): Promise<FrameAiOutput>;
}
