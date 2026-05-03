"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MemoryFrame } from "@/data/demoFrames";
import { useTheme } from "@/hooks/useTheme";
import { track } from "@/lib/analytics";
import { X, Download, Upload, Trash2, AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  frameCount: number;
  allFrames: MemoryFrame[];
  onImport: (frames: MemoryFrame[]) => void;
  onClearAll: () => void;
  showToast: (message: string) => void;
};

function triggerBackupDownload(frames: MemoryFrame[]) {
  const data = frames.map((f) => ({
    id: f.id,
    type: f.type,
    content: f.content,
    date: f.date,
    time: f.time,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
    wordCount: f.wordCount,
    duration: f.duration,
    status: f.status,
    summary: f.summary,
    tags: f.tags,
    tone: f.tone,
    ai: f.ai,
    deletedAt: f.deletedAt ?? undefined,
    frameIndex: f.frameIndex,
  }));
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob(["﻿" + json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const filename = `jingxi-backup-${stamp}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validateBackupData(raw: unknown): {
  valid: true;
  frames: MemoryFrame[];
} | {
  valid: false;
  error: string;
} {
  if (!Array.isArray(raw)) {
    return { valid: false, error: "备份文件格式无效：应为数组" };
  }
  if (raw.length === 0) {
    return { valid: false, error: "备份文件为空，无记录可导入" };
  }
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") {
      return { valid: false, error: `第 ${i + 1} 条记录格式无效` };
    }
    if (typeof (item as Record<string, unknown>).id !== "string") {
      return { valid: false, error: `第 ${i + 1} 条记录缺少 id` };
    }
    if (typeof (item as Record<string, unknown>).content !== "string") {
      return { valid: false, error: `第 ${i + 1} 条记录缺少 content` };
    }
    if (typeof (item as Record<string, unknown>).date !== "string") {
      return { valid: false, error: `第 ${i + 1} 条记录缺少 date` };
    }
  }
  return { valid: true, frames: raw as MemoryFrame[] };
}

export default function DataManager({
  open,
  onClose,
  frameCount,
  allFrames,
  onImport,
  onClearAll,
  showToast,
}: Props) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearInput, setClearInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [pendingImport, setPendingImport] = useState<MemoryFrame[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { themeId } = useTheme();

  const handleExport = () => {
    triggerBackupDownload(allFrames);
    track("backup_exported");
    showToast(`已导出 ${allFrames.length} 条记录`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(reader.result as string);
        const result = validateBackupData(raw);
        if (!result.valid) {
          showToast(result.error);
          setImporting(false);
          // Reset file input so same file can be re-selected
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        setPreviewCount(result.frames.length);
        setPendingImport(result.frames);
      } catch {
        showToast("备份文件解析失败，请检查文件是否完整");
      }
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = () => {
      showToast("读取文件失败，请重试");
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    onImport(pendingImport);
    showToast(`已导入 ${pendingImport.length} 条记录`);
    setPendingImport(null);
    setPreviewCount(null);
  };

  const cancelImport = () => {
    setPendingImport(null);
    setPreviewCount(null);
  };

  const handleClear = () => {
    if (clearInput !== "确认清空") return;
    onClearAll();
    showToast("已清空全部本地数据");
    setConfirmingClear(false);
    setClearInput("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] bg-surface-overlay"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed bottom-0 right-0 top-0 z-[60] w-full max-w-md border-l border-border-subtle bg-bg-base"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
              <h2 className="text-xs font-medium tracking-[0.2em] text-text-muted">
                数据管理
              </h2>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted/30 transition-colors hover:text-text-muted/60"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-6 space-y-6" style={{ height: "calc(100% - 57px)" }}>
              {/* Data summary */}
              <div
                className="rounded px-4 py-4 text-xs leading-relaxed"
                style={{
                  border: "1px solid var(--border-soft)",
                  color: "var(--text-muted)",
                  backgroundColor: "color-mix(in srgb, var(--bg-soft) 60%, transparent)",
                }}
              >
                <p className="mb-2">
                  当前本地帧数量：<span className="text-text-primary font-medium">{frameCount}</span> 帧
                </p>
                <p>
                  你的记录保存在当前设备浏览器中。更换设备、清理浏览器数据或系统回收存储空间，可能导致记录丢失。请定期导出备份。
                </p>
              </div>

              {/* Export backup */}
              <button
                onClick={handleExport}
                className="flex w-full items-center justify-center gap-2 rounded border border-border-soft bg-bg-base px-4 py-3 text-xs text-text-secondary transition-colors hover:border-accent/20 hover:text-text-primary"
              >
                <Download size={14} />
                导出全部记录 (JSON)
              </button>

              {/* Import backup */}
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {pendingImport && previewCount !== null ? (
                  <div
                    className="rounded px-4 py-3 text-xs leading-relaxed space-y-3"
                    style={{
                      border: "1px solid var(--accent-soft)",
                      backgroundColor: "color-mix(in srgb, var(--accent) 5%, transparent)",
                    }}
                  >
                    <p className="text-text-secondary">
                      将用备份中的 <span className="text-text-primary font-medium">{previewCount}</span> 条记录
                      完全替换当前 <span className="text-text-primary font-medium">{frameCount}</span> 条本地记录，此操作不可撤销。
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={confirmImport}
                        className="flex-1 rounded py-2 text-xs font-medium transition-colors hover:opacity-90"
                        style={{
                          backgroundColor: "var(--accent)",
                          color: "var(--bg-base)",
                        }}
                      >
                        确认导入
                      </button>
                      <button
                        onClick={cancelImport}
                        className="flex-1 rounded border border-border-soft py-2 text-xs text-text-muted transition-colors hover:text-text-secondary"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="flex w-full items-center justify-center gap-2 rounded border border-border-soft bg-bg-base px-4 py-3 text-xs text-text-secondary transition-colors hover:border-accent/20 hover:text-text-primary disabled:opacity-40"
                  >
                    <Upload size={14} />
                    {importing ? "读取中…" : "导入备份 (JSON)"}
                  </button>
                )}
              </div>

              {/* Divider before danger zone */}
              <div style={{ height: 1, backgroundColor: "var(--border-soft)" }} />

              {/* Clear data — danger */}
              {confirmingClear ? (
                <div
                  className="rounded px-4 py-4 space-y-3"
                  style={{
                    border: "1px solid var(--status-error)",
                    backgroundColor: "color-mix(in srgb, var(--status-error) 5%, transparent)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} style={{ color: "var(--status-error)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--status-error)" }}>
                      此操作不可撤销
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    清空后将丢失全部本地记录。如需保留，请先导出备份。
                  </p>
                  <input
                    value={clearInput}
                    onChange={(e) => setClearInput(e.target.value)}
                    placeholder='请键入"确认清空"'
                    className="w-full rounded border border-border-soft bg-bg-soft px-3 py-2 text-xs text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-status-error/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleClear}
                      disabled={clearInput !== "确认清空"}
                      className="flex-1 rounded py-2 text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-30"
                      style={{
                        backgroundColor: "var(--status-error)",
                        color: "var(--bg-base)",
                      }}
                    >
                      确认清空
                    </button>
                    <button
                      onClick={() => {
                        setConfirmingClear(false);
                        setClearInput("");
                      }}
                      className="flex-1 rounded border border-border-soft py-2 text-xs text-text-muted transition-colors hover:text-text-secondary"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingClear(true)}
                  className="flex w-full items-center justify-center gap-2 rounded border px-4 py-3 text-xs transition-colors"
                  style={{
                    borderColor: "var(--status-error)",
                    color: "var(--status-error)",
                    backgroundColor: "color-mix(in srgb, var(--status-error) 8%, transparent)",
                  }}
                >
                  <Trash2 size={14} />
                  清空本地数据
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
