// ── Text formatting — display vs export separation ────────────────────────
// formatDisplayText → UI 展示层（首行缩进、段落间距）
// formatExportText  → TXT/MD/PNG 导出层（派生文本，不写回 content）
//
// 核心原则：任何格式化函数都不修改持久化的 content/rawContent。

import type { TextFormatOptions } from "./types";
import { DEFAULT_FORMAT_OPTIONS } from "./types";

function normalizeLines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function collapseBlankLines(lines: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimEnd();
    if (trimmed.length > 0) {
      result.push(trimmed);
    } else {
      const prev = i > 0 ? lines[i - 1].trimEnd() : "";
      const next = i < lines.length - 1 ? lines[i + 1].trimEnd() : "";
      if (prev.length > 0 && next.length > 0) result.push("");
    }
  }
  return result;
}

/**
 * UI 展示用格式化 — 返回派生文本，不修改原始 content。
 * 默认启用首行缩进和段落间距。
 */
export function formatDisplayText(text: string, options?: Partial<TextFormatOptions>): string {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  if (!text.trim()) return text;

  let normalized = normalizeLines(text);
  let lines = normalized.split("\n");

  if (opts.trimExtraBlankLines) {
    lines = collapseBlankLines(lines);
  }

  const indented = lines.map((p) => {
    if (p.length === 0) return p;
    if (opts.firstLineIndent && !p.startsWith("　　") && !p.startsWith("  ")) {
      return "　　" + p;
    }
    return p;
  });

  const separator = opts.paragraphSpacing === "comfortable" ? "\n" : "\n";
  return indented.join(separator);
}

/**
 * 导出用格式化 — 返回派生文本，不修改原始 content。
 * 默认不添加全角空格缩进（由导出组件的 CSS text-indent 处理）。
 */
export function formatExportText(text: string, options?: Partial<TextFormatOptions>): string {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, firstLineIndent: false, ...options };
  if (!text.trim()) return text;

  let normalized = normalizeLines(text);
  let lines = normalized.split("\n");

  if (opts.trimExtraBlankLines) {
    lines = collapseBlankLines(lines);
  }

  // Export: keep paragraphs clean, no forced indent characters
  const cleaned = lines.map((p) => p.trimEnd());

  const separator = opts.paragraphSpacing === "comfortable" ? "\n\n" : "\n";
  return cleaned.join(separator);
}

/**
 * @deprecated 使用 formatDisplayText 或 formatExportText。
 * 保留用于向后兼容 — 等同于 formatDisplayText。
 */
export function formatText(text: string): string {
  return formatDisplayText(text);
}
