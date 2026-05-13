// ── Data export utilities ─────────────────────────────────────────────────
// Three formats: JSON (machine-readable, full MemoryFrame),
// Markdown (human-readable, grouped by date),
// TXT (chronological, minimal).
//
// 文本来源：导出始终使用 rawContent ?? content，排版修饰由 formatExportText 在导出阶段派生，
// 不写回 frame.content / frame.rawContent。

import { MemoryFrame } from "@/data/demoFrames";
import { formatExportText } from "@/src/domain/frame/textFormat";

export type ExportOptions = {
  content: boolean;
  tags: boolean;
  summary: boolean;
};

function getDateStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getExportFilename(ext: string, frames: MemoryFrame[]): string {
  if (frames.length === 1) {
    const f = frames[0];
    const time = f.time.replace(":", "");
    return `jingxi-frame-${f.date}-${time}.${ext}`;
  }
  return `jingxi-archive-${getDateStamp()}.${ext}`;
}

/** 导出正文来源：优先 rawContent，fallback 到 content */
function getExportText(f: MemoryFrame): string {
  return (f.rawContent || f.content).trim();
}

function triggerDownload(filename: string, content: string, mime: string, addBOM = false) {
  if (!content.trim()) {
    throw new Error("导出内容为空，请检查记录是否包含文字。");
  }

  const bom = addBOM ? "﻿" : "";
  const blob = new Blob([bom + content], { type: mime });

  // iOS Safari ignores <a download> and opens blob URL in a new tab,
  // losing charset encoding. Use native share sheet instead.
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: mime });
    if (navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file] }).catch(() => {
        fallbackDownload();
      });
      return;
    }
  }

  fallbackDownload();

  function fallbackDownload() {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

function groupByDate(frames: MemoryFrame[]): Map<string, MemoryFrame[]> {
  const map = new Map<string, MemoryFrame[]>();
  for (const f of frames) {
    const list = map.get(f.date);
    if (list) list.push(f);
    else map.set(f.date, [f]);
  }
  return map;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

// ── JSON export — 完整 MemoryFrame 数据 ─────────────────────────────────────

export function toJSON(frames: MemoryFrame[], opts: ExportOptions = { content: true, tags: true, summary: true }) {
  const data = frames.map((f) => {
    const out: Record<string, unknown> = {};
    // Core
    out.id = f.id;
    out.date = f.date;
    out.time = f.time;
    out.frameIndex = f.frameIndex;
    out.wordCount = f.wordCount;
    out.type = f.type;
    out.createdAt = f.createdAt;
    out.updatedAt = f.updatedAt;
    // Content — always include rawContent, optionally content
    out.rawContent = f.rawContent;
    if (opts.content) out.content = f.content;
    // AI — optional per export options
    if (opts.tags) out.tags = f.tags;
    if (opts.summary) out.summary = f.summary;
    if (f.tone) out.tone = f.tone;
    if (f.ai) out.ai = f.ai;
    if (f.developed) out.developed = f.developed;
    // Lifecycle
    out.frameStatus = f.frameStatus;
    out.developStatus = f.developStatus;
    out.status = f.status; // deprecated but kept for compat
    if (f.deletedAt) out.deletedAt = f.deletedAt;
    if (f.keywords?.length) out.keywords = f.keywords; // deprecated but kept for old data
    return out;
  });
  const json = JSON.stringify(data, null, 2);
  triggerDownload(getExportFilename("json", frames), json, "application/json;charset=utf-8", true);
}

// ── Markdown export ────────────────────────────────────────────────────────

export function toMarkdown(frames: MemoryFrame[], opts: ExportOptions = { content: true, tags: true, summary: true }) {
  const grouped = groupByDate(frames);
  const dates = [...grouped.keys()].sort();
  const lines: string[] = [];

  lines.push("# 镜隙之间 · 时间胶片");
  lines.push("");
  lines.push(`> 导出日期：${getDateStamp()}`);
  lines.push(`> 共计 ${frames.length} 帧`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const date of dates) {
    const dayFrames = grouped.get(date)!;
    lines.push(`## ${date}`);
    lines.push("");

    for (const f of dayFrames) {
      // Frame header with index badge
      lines.push(`### 第 ${pad(f.frameIndex)} 帧  \`${f.time}\``);
      lines.push("");

      // Status badge
      const statusLabel = f.status === "saved" ? "已保存" : f.status === "organizing" ? "整理中" : "显影中";
      lines.push(`> 状态：${statusLabel}  |  ${f.wordCount} 字`);

      // Tags on same metadata line
      if (opts.tags && f.tags.length > 0) {
        lines.push(`> 标签：${f.tags.join(" · ")}`);
      }

      // Summary
      if (opts.summary && f.summary) {
        lines.push(`> ${f.summary}`);
      }

      lines.push("");

      // Content block — source: rawContent ?? content, formatted at export time
      if (opts.content) {
        const raw = getExportText(f);
        if (raw) {
          const formatted = formatExportText(raw, { trimExtraBlankLines: true, paragraphSpacing: "comfortable" });
          lines.push(formatted);
          lines.push("");
        }
      }

      lines.push("---");
      lines.push("");
    }
  }

  triggerDownload(getExportFilename("md", frames), lines.join("\n"), "text/markdown;charset=utf-8", true);
}

// ── TXT export ─────────────────────────────────────────────────────────────

export function toTXT(frames: MemoryFrame[], opts: ExportOptions = { content: true, tags: true, summary: true }) {
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════");
  lines.push("  镜隙之间 · 时间胶片");
  lines.push("═══════════════════════════════════════");
  lines.push("");
  lines.push(`  导出日期：${getDateStamp()}`);
  lines.push(`  共计 ${frames.length} 帧`);
  lines.push("");
  lines.push("───────────────────────────────────────");
  lines.push("");

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];

    // Frame header
    lines.push(`┌─ 第 ${pad(f.frameIndex)} 帧 ──────────────────────────`);
    lines.push(`│ ${f.date}  ${f.time}`);
    lines.push(`│ 状态：${f.status === "saved" ? "已保存" : f.status === "organizing" ? "整理中" : "显影中"}  |  ${f.wordCount} 字`);
    if (opts.tags && f.tags.length > 0) {
      lines.push(`│ 标签：${f.tags.join(" · ")}`);
    }
    if (opts.summary && f.summary) {
      lines.push(`│ ${f.summary}`);
    }
    lines.push("│");

    // Content — source: rawContent ?? content, formatted at export time
    if (opts.content) {
      const raw = getExportText(f);
      if (raw) {
        const formatted = formatExportText(raw, { trimExtraBlankLines: true, paragraphSpacing: "comfortable" });
        const contentLines = formatted.split("\n");
        for (const cl of contentLines) {
          lines.push(`│ ${cl}`);
        }
      }
      lines.push("│");
    }

    lines.push("└──────────────────────────────────────");

    if (i < frames.length - 1) {
      lines.push("");
    }
  }

  lines.push("");
  lines.push("═══════════════════════════════════════");

  triggerDownload(getExportFilename("txt", frames), lines.join("\n"), "text/plain;charset=utf-8", true);
}
