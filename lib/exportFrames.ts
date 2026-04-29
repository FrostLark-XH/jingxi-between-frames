// ── Data export utilities ─────────────────────────────────────────────────
// Three formats: JSON (machine-readable, full MemoryFrame),
// Markdown (human-readable, grouped by date),
// TXT (chronological, minimal).

import { MemoryFrame } from "@/data/demoFrames";

function getDateStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}

function triggerDownload(filename: string, content: string, mime: string, addBOM = false) {
  const bom = addBOM ? "﻿" : "";
  const blob = new Blob([bom + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

// ── JSON export ────────────────────────────────────────────────────────────

export function toJSON(frames: MemoryFrame[]) {
  const json = JSON.stringify(frames, null, 2);
  triggerDownload(`jingxi_archive_${getDateStamp()}.json`, json, "application/json;charset=utf-8");
}

// ── Markdown export ────────────────────────────────────────────────────────

export function toMarkdown(frames: MemoryFrame[]) {
  const grouped = groupByDate(frames);
  const dates = [...grouped.keys()].sort();
  const lines: string[] = [];

  lines.push("# 镜隙之间 · 时间胶片");
  lines.push("");
  lines.push(`导出日期：${getDateStamp()}`);
  lines.push(`共计 ${frames.length} 帧`);
  lines.push("");

  for (const date of dates) {
    const dayFrames = grouped.get(date)!;
    lines.push(`## ${date}`);
    lines.push("");

    for (const f of dayFrames) {
      lines.push(`### 第 ${String(f.frameIndex).padStart(2, "0")} 帧 · ${f.time}`);
      lines.push("");
      lines.push(f.content);
      lines.push("");
      if (f.summary) lines.push(`> ${f.summary}`);
      if (f.tags.length > 0) lines.push(`> 标签：${f.tags.join("、")}`);
      lines.push("");
    }
  }

  triggerDownload(`jingxi_archive_${getDateStamp()}.md`, lines.join("\n"), "text/markdown;charset=utf-8");
}

// ── TXT export ─────────────────────────────────────────────────────────────

export function toTXT(frames: MemoryFrame[]) {
  const lines: string[] = [];

  lines.push("镜隙之间 · 时间胶片");
  lines.push(`导出日期：${getDateStamp()}`);
  lines.push(`共计 ${frames.length} 帧`);
  lines.push("─".repeat(40));
  lines.push("");

  for (const f of frames) {
    lines.push(`[${f.date} ${f.time}]  第 ${String(f.frameIndex).padStart(2, "0")} 帧`);
    lines.push("");
    lines.push(f.content);
    lines.push("");
    if (f.summary) lines.push(`  — ${f.summary}`);
    if (f.tags.length > 0) lines.push(`  — ${f.tags.join(" / ")}`);
    lines.push("");
    lines.push("─".repeat(40));
    lines.push("");
  }

  triggerDownload(`jingxi_archive_${getDateStamp()}.txt`, lines.join("\n"), "text/plain;charset=utf-8", true);
}
