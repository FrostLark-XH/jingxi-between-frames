import type { FrameAiMetadata } from "@/services/ai/types";

// ── DevelopedData — AI 显影结果，挂在 Frame 下 ────────────────────────────
// AI 只能写 developed 字段，不可覆盖 rawText (content)。

export type DevelopedData = {
  summary: string;
  tags: string[];
  tone?: string;
  metadata?: FrameAiMetadata;
};

// ── Frame lifecycle states ────────────────────────────────────────────────

/** 帧本身的生命周期 — 独立于 AI 处理状态 */
export type FrameStatus = "active" | "deleted";

/** AI 显影处理状态 — 独立于帧生命周期 */
export type DevelopStatus = "idle" | "developing" | "developed" | "failed" | "stale";

// ── Text formatting options ───────────────────────────────────────────────

export type TextFormatOptions = {
  /** 首行缩进: true = 全角空格缩进 */
  firstLineIndent: boolean;
  /** 段落间距 */
  paragraphSpacing: "compact" | "comfortable";
  /** 清理多余空行 */
  trimExtraBlankLines: boolean;
};

export const DEFAULT_FORMAT_OPTIONS: TextFormatOptions = {
  firstLineIndent: true,
  paragraphSpacing: "comfortable",
  trimExtraBlankLines: true,
};

// ── MemoryFrame — 最小记录单位 ────────────────────────────────────────────

export type MemoryFrame = {
  id: string;
  content: string; // rawText — AI 不可覆盖，保存用户原始输入
  rawContent: string; // 显式原始文本副本，v3 新增
  preview: string;
  // Flat AI fields retained for backward compatibility with existing localStorage
  summary: string;
  tags: string[];
  keywords?: string[]; // deprecated, kept for migration
  tone?: string;
  ai?: FrameAiMetadata;
  // Structured AI result — computed from flat fields on load
  developed?: DevelopedData;
  date: string;
  time: string;
  frameIndex: number;
  wordCount: number;
  duration?: string;
  type: "text" | "voice";
  /** @deprecated 使用 frameStatus + developStatus 替代 */
  status: "saved" | "organizing" | "developing";
  frameStatus: FrameStatus;
  developStatus: DevelopStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};
