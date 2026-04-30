// ── Data export utilities ─────────────────────────────────────────────────
// Three formats: JSON (machine-readable, full MemoryFrame),
// Markdown (human-readable, grouped by date),
// TXT (chronological, minimal).

import { MemoryFrame } from "@/data/demoFrames";

export type ExportOptions = {
  content: boolean;
  tags: boolean;
  summary: boolean;
};

function getDateStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}

function triggerDownload(filename: string, content: string, mime: string, addBOM = false) {
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

// ── JSON export ────────────────────────────────────────────────────────────

export function toJSON(frames: MemoryFrame[], opts: ExportOptions = { content: true, tags: true, summary: true }) {
  const data = frames.map((f) => {
    const out: Record<string, unknown> = {};
    if (opts.content) {
      out.content = f.content;
      out.date = f.date;
      out.time = f.time;
      out.frameIndex = f.frameIndex;
      out.wordCount = f.wordCount;
    }
    if (opts.tags) out.tags = f.tags;
    if (opts.summary) out.summary = f.summary;
    out.id = f.id;
    out.createdAt = f.createdAt;
    return out;
  });
  const json = JSON.stringify(data, null, 2);
  triggerDownload(`jingxi_archive_${getDateStamp()}.json`, json, "application/json;charset=utf-8");
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
      lines.push(`### 第 ${pad(f.frameIndex)} 帧　\`${f.time}\``);
      lines.push("");

      // Status badge
      const statusLabel = f.status === "saved" ? "已保存" : f.status === "organizing" ? "整理中" : "显影中";
      lines.push(`> 状态：${statusLabel}　|　${f.wordCount} 字`);

      // Tags on same metadata line
      if (opts.tags && f.tags.length > 0) {
        lines.push(`> 标签：${f.tags.join(" · ")}`);
      }

      // Summary
      if (opts.summary && f.summary) {
        lines.push(`> ${f.summary}`);
      }

      lines.push("");

      // Content block
      if (opts.content) {
        lines.push(f.content);
        lines.push("");
      }

      lines.push("---");
      lines.push("");
    }
  }

  triggerDownload(`jingxi_archive_${getDateStamp()}.md`, lines.join("\n"), "text/markdown;charset=utf-8");
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
    lines.push(`│ ${f.date}　${f.time}`);
    lines.push(`│ 状态：${f.status === "saved" ? "已保存" : f.status === "organizing" ? "整理中" : "显影中"}　|　${f.wordCount} 字`);
    if (opts.tags && f.tags.length > 0) {
      lines.push(`│ 标签：${f.tags.join(" · ")}`);
    }
    if (opts.summary && f.summary) {
      lines.push(`│ ${f.summary}`);
    }
    lines.push("│");

    // Content
    if (opts.content) {
      const contentLines = f.content.split("\n");
      for (const cl of contentLines) {
        lines.push(`│ ${cl}`);
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

  triggerDownload(`jingxi_archive_${getDateStamp()}.txt`, lines.join("\n"), "text/plain;charset=utf-8", true);
}
