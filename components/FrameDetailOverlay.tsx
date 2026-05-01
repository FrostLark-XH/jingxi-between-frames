"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MemoryFrame, formatFrameNumber } from "@/data/demoFrames";
import { toJSON, toMarkdown, toTXT } from "@/lib/exportFrames";
import { contentHash, isAiStale } from "@/services/ai/types";
import { X, Copy, Type, Mic, ChevronDown, ChevronUp, Trash2, Edit3, Check, Plus, Download, AlertTriangle, RefreshCw } from "lucide-react";

type Props = {
  frame: MemoryFrame | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Pick<MemoryFrame, "content" | "tags" | "summary" | "keywords" | "tone" | "ai">>) => void;
  showToast: (message: string) => void;
};

const STATUS_LABEL: Record<MemoryFrame["status"], string> = {
  saved: "已保存",
  organizing: "整理中",
  developing: "显影中",
};

const EXPORT_BTNS = [
  { label: "JSON", fn: (frames: MemoryFrame[]) => toJSON(frames, { content: true, tags: true, summary: true }) },
  { label: "MD", fn: (frames: MemoryFrame[]) => toMarkdown(frames, { content: true, tags: true, summary: true }) },
  { label: "TXT", fn: (frames: MemoryFrame[]) => toTXT(frames, { content: true, tags: true, summary: true }) },
];

export default function FrameDetailOverlay({ frame, onClose, onDelete, onUpdate, showToast }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTagValue, setNewTagValue] = useState("");
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [redeveloping, setRedeveloping] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const newTagInputRef = useRef<HTMLInputElement>(null);

  // Track whether content or tags have been modified since opening
  const originalContent = useRef("");
  const originalTags = useRef<string[]>([]);

  useEffect(() => {
    if (frame) {
      originalContent.current = frame.content;
      originalTags.current = [...frame.tags];
    }
  }, [frame?.id]);

  const hasContentChanged = isEditing && editContent.trim() !== originalContent.current;
  // Tags are saved immediately on add/remove, so check based on edit mode state
  const hasUnsavedChanges = hasContentChanged;

  // Reset state when switching between frames
  useEffect(() => {
    setConfirmingDelete(false);
    setExpanded(false);
    setCopied(null);
    setIsEditing(false);
    setIsEditingTags(false);
    setNewTagValue("");
    setShowUnsavedWarning(false);
  }, [frame?.id]);

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
    }
  }, [isEditing]);

  // Auto-focus new tag input
  useEffect(() => {
    if (newTagValue === "" && newTagInputRef.current) {
      newTagInputRef.current.focus();
    }
  }, [newTagValue]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleDelete = () => {
    if (!frame) return;
    onDelete(frame.id);
    onClose();
  };

  const handleStartEdit = () => {
    if (!frame) return;
    setEditContent(frame.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!frame || !editContent.trim()) return;
    onUpdate(frame.id, { content: editContent.trim() });
    originalContent.current = editContent.trim();
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent("");
  };

  const handleRedevelop = async () => {
    if (!frame || redeveloping) return;
    setRedeveloping(true);

    try {
      const res = await fetch("/api/ai/develop-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: frame.content, createdAt: new Date().toISOString() }),
      });
      if (res.ok) {
        const data = await res.json();
        const newAi: MemoryFrame["ai"] = {
          provider: data.provider || "mock",
          model: data.model,
          generatedAt: new Date().toISOString(),
          version: "v0.6",
          contentHash: contentHash(frame.content),
        };
        onUpdate(frame.id, {
          summary: data.summary || frame.summary,
          tags: data.tags || frame.tags,
          keywords: data.keywords || [],
          tone: data.tone || "平静",
          ai: newAi,
        });
      } else {
        showToast("重新显影失败，保留原有摘要");
      }
    } catch {
      showToast("重新显影失败，保留原有摘要");
    } finally {
      setRedeveloping(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (!frame) return;
    const newTags = frame.tags.filter((t) => t !== tag);
    onUpdate(frame.id, { tags: newTags });
    originalTags.current = newTags;
  };

  const handleAddTag = () => {
    if (!frame || !newTagValue.trim()) return;
    const trimmed = newTagValue.trim();
    if (frame.tags.includes(trimmed)) {
      setNewTagValue("");
      return;
    }
    const newTags = [...frame.tags, trimmed];
    onUpdate(frame.id, { tags: newTags });
    originalTags.current = newTags;
    setNewTagValue("");
  };

  const handleExportSingle = (fn: (frames: MemoryFrame[]) => void) => {
    if (!frame) return;
    fn([frame]);
  };

  const handleRequestClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleDiscardAndClose = () => {
    setIsEditing(false);
    setEditContent("");
    setShowUnsavedWarning(false);
    onClose();
  };

  const handleSaveAndClose = () => {
    if (!frame || !editContent.trim()) return;
    onUpdate(frame.id, { content: editContent.trim() });
    originalContent.current = editContent.trim();
    setIsEditing(false);
    setShowUnsavedWarning(false);
    onClose();
  };

  if (!frame) return null;

  const statusColor =
    frame.status === "saved" ? "var(--text-muted)"
    : frame.status === "organizing" ? "var(--accent-soft)"
    : "var(--accent-glow)";

  const contentText = frame.content;
  const isLong = contentText.length > 200;
  const aiStale = isAiStale(frame.content, frame.ai);
  const needsRedevelop = aiStale; // stale or never developed

  return (
    <AnimatePresence>
      {frame && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleRequestClose}
          className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto px-5 py-20 bg-surface-overlay"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-app border border-border-subtle p-6 paper-grain rounded-card border-l border-l-border-warm bg-bg-base"
          >
            {/* Close — subtle circle */}
            <button
              onClick={handleRequestClose}
              className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full text-text-muted/30 transition-colors hover:text-text-muted/60"
            >
              <X size={15} />
            </button>

            {/* Header — film-strip numbering feel */}
            <div className="mb-6 flex items-start justify-between pr-10">
              <div>
                <div className="font-mono text-micro tracking-[0.2em] text-text-muted/30">
                  NO.{formatFrameNumber(frame.frameIndex)}
                </div>
                <div className="mt-1 font-mono text-xs tracking-wider text-text-secondary">
                  {frame.date} · {frame.time}
                </div>
                <div className="mt-1 font-mono text-micro text-text-muted/30">
                  {frame.createdAt}
                </div>
              </div>
              <div className="flex items-center gap-3 text-micro" style={{ color: statusColor }}>
                <span className="flex items-center gap-1">
                  {frame.type === "voice" ? <Mic size={10} /> : <Type size={10} />}
                  {frame.type === "voice"
                    ? `语音 · ${frame.duration}`
                    : `文本 · ${frame.wordCount} 字`}
                </span>
                <span>{STATUS_LABEL[frame.status]}</span>
              </div>
            </div>

            {/* Content — editable */}
            <div className="mb-5">
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    ref={editTextareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    className="w-full resize-none border border-border-subtle bg-bg-soft/60 px-4 py-3 text-base leading-relaxed text-text-primary focus:border-accent/25 focus:outline-none rounded-button"
                    placeholder="编辑这一帧…"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim()}
                      className="flex items-center gap-1 rounded px-3 py-2 text-xs transition-colors hover:opacity-80 disabled:opacity-30 bg-accent text-bg-base"
                    >
                      <Check size={10} />
                      保存
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="rounded border border-border-subtle px-3 py-2 text-xs text-text-muted transition-colors hover:text-text-secondary"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    className={`font-serif text-base leading-relaxed text-text-primary ${
                      !expanded && isLong ? "line-clamp-4" : ""
                    }`}
                  >
                    {contentText}
                  </p>
                  {isLong && (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="mt-2 flex items-center gap-1 text-xs text-text-muted/50 transition-colors hover:text-text-muted"
                    >
                      {expanded ? (
                        <>
                          收起 <ChevronUp size={10} />
                        </>
                      ) : (
                        <>
                          展开全文 <ChevronDown size={10} />
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Summary + re-develop */}
            <div
              className="mb-5 border border-border-subtle px-4 py-3 rounded-card bg-surface-1 opacity-60"
            >
              <p className={`text-xs leading-relaxed ${frame.summary ? "text-text-muted/50" : "text-text-muted/20 italic"}`}>
                {frame.summary || "请静候时光沉淀…"}
              </p>

              {/* AI stale indicator + re-develop button */}
              {needsRedevelop && (
                <div className="mt-3 flex items-center gap-2 border-t border-border-soft pt-3">
                  {frame.ai ? (
                    <span className="flex items-center gap-1 text-micro text-accent-soft/70">
                      <AlertTriangle size={10} />
                      AI 摘要可能已过期
                    </span>
                  ) : (
                    <span className="text-micro text-text-muted/35">尚未显影</span>
                  )}
                  <button
                    onClick={handleRedevelop}
                    disabled={redeveloping}
                    className="flex items-center gap-1 rounded border border-accent/20 px-2.5 py-1 text-micro text-accent/70 transition-colors hover:bg-accent/10 disabled:opacity-30"
                  >
                    <RefreshCw size={10} className={redeveloping ? "animate-spin" : ""} />
                    {redeveloping ? "显影中…" : frame.ai ? "重新显影" : "显影"}
                  </button>
                  {frame.ai && (
                    <span className="text-micro text-text-muted/25">将根据当前原文重新生成摘要与标签</span>
                  )}
                </div>
              )}
            </div>

            {/* Keywords + tone — AI metadata badges */}
            {(frame.keywords && frame.keywords.length > 0 || frame.tone) && (
              <div className="mb-5 flex flex-wrap items-center gap-1.5">
                {frame.tone && (
                  <span className="inline-flex items-center border border-accent/15 bg-accent/5 px-2 py-0.5 text-micro text-accent/60 rounded-tag">
                    {frame.tone}
                  </span>
                )}
                {frame.keywords && frame.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center border border-border-subtle bg-transparent px-2 py-0.5 text-micro text-text-muted/35 rounded-tag"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Tags — editable */}
            <div className="mb-5 flex flex-wrap items-center gap-1.5">
              {frame.tags.length === 0 && !isEditingTags && (
                <span className="text-micro text-text-muted/20">暂无标签</span>
              )}
              {frame.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 border border-border-subtle bg-transparent px-2.5 py-1 text-micro text-text-muted rounded-tag"
                >
                  {tag}
                  {isEditingTags && (
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full text-text-muted/30 transition-colors hover:text-status-error"
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}
              {isEditingTags && (
                <span
                  className="inline-flex items-center border border-dashed border-border-subtle bg-transparent px-2 py-1 rounded-tag"
                >
                  <input
                    ref={newTagInputRef}
                    value={newTagValue}
                    onChange={(e) => setNewTagValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTag();
                      if (e.key === "Escape") setNewTagValue("");
                    }}
                    placeholder="新标签"
                    className="w-20 bg-transparent text-micro text-text-muted placeholder:text-text-muted/25 focus:outline-none"
                  />
                  <button
                    onClick={handleAddTag}
                    className="ml-1 flex h-7 w-7 items-center justify-center text-text-muted/30 transition-colors hover:text-accent"
                  >
                    <Plus size={11} />
                  </button>
                </span>
              )}
              {!isEditingTags && (
                <button
                  onClick={() => setIsEditingTags(true)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-text-muted/20 transition-colors hover:text-text-muted/50"
                >
                  <Plus size={13} />
                </button>
              )}
              {isEditingTags && (
                <button
                  onClick={() => setIsEditingTags(false)}
                  className="ml-1 text-micro text-text-muted/30 transition-colors hover:text-text-muted/60"
                >
                  完成
                </button>
              )}
            </div>

            {/* Actions */}
            {confirmingDelete ? (
              <div
                className="flex flex-col gap-2 border px-4 py-3 rounded-card border-border-warm bg-surface-1 opacity-60"
              >
                <p className="text-center text-xs text-text-muted/60">
                  移入回收站？7 天后自动清除。
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="flex-1 border border-border-subtle py-2 text-xs text-text-muted transition-colors hover:text-text-secondary rounded-card"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 text-xs transition-colors hover:opacity-80 rounded-card border border-status-error text-status-error bg-status-error opacity-[0.15]"
                  >
                    确认删除
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(frame.content, "已复制原文")}
                  className="flex flex-1 items-center justify-center gap-1.5 border border-border-subtle py-2 text-xs transition-colors hover:border-border-subtle/80 hover:text-text-primary active:scale-95 rounded-card"
                  style={{ color: copied === "已复制原文" ? "var(--accent)" : undefined }}
                >
                  <Copy size={12} />
                  {copied === "已复制原文" ? "已复制" : "复制原文"}
                </button>
                <button
                  onClick={() => handleCopy(frame.summary, "已复制摘要")}
                  className="flex flex-1 items-center justify-center gap-1.5 border border-border-subtle py-2 text-xs transition-colors hover:border-border-subtle/80 hover:text-text-primary active:scale-95 rounded-card"
                  style={{ color: copied === "已复制摘要" ? "var(--accent)" : undefined }}
                >
                  <Copy size={12} />
                  {copied === "已复制摘要" ? "已复制" : "复制摘要"}
                </button>
                {!isEditing ? (
                  <button
                    onClick={handleStartEdit}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center border border-border-subtle transition-colors hover:border-border-subtle/80 hover:text-text-primary rounded-card text-text-muted opacity-40"
                  >
                    <Edit3 size={14} />
                  </button>
                ) : null}
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center border border-border-subtle transition-colors hover:border-status-error/30 rounded-card text-text-muted opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Export single frame */}
            <div className="mt-3 flex items-center gap-2 border-t border-border-soft pt-3">
              <Download size={10} className="text-text-muted/30" />
              <span className="text-micro text-text-muted/30">导出此帧</span>
              <div className="flex gap-1">
                {EXPORT_BTNS.map(({ label, fn }) => (
                  <button
                    key={label}
                    onClick={() => handleExportSingle(fn)}
                    className="rounded border border-border-subtle px-2 py-0.5 text-micro text-text-muted/40 transition-colors hover:border-accent/20 hover:text-text-secondary"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Unsaved changes warning overlay */}
            <AnimatePresence>
              {showUnsavedWarning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-card"
                  style={{ background: "color-mix(in srgb, var(--bg-base) 92%, transparent)" }}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="border px-5 py-4 text-center rounded-card border-border-warm bg-bg-soft"
                  >
                    <AlertTriangle size={16} className="mx-auto mb-2 text-accent-soft" />
                    <p className="mb-1 text-xs text-text-secondary">有未保存的修改</p>
                    <p className="mb-4 text-micro text-text-muted/50">关闭将丢失已编辑的内容</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowUnsavedWarning(false)}
                        className="flex-1 rounded border border-border-subtle py-2 text-micro text-text-muted transition-colors hover:text-text-secondary"
                      >
                        继续编辑
                      </button>
                      <button
                        onClick={handleDiscardAndClose}
                        className="flex-1 rounded py-2 text-micro transition-colors hover:opacity-80 border border-status-error text-status-error bg-status-error opacity-[0.12]"
                      >
                        放弃
                      </button>
                      <button
                        onClick={handleSaveAndClose}
                        disabled={!editContent.trim()}
                        className="flex-1 rounded py-2 text-micro transition-colors hover:opacity-80 disabled:opacity-30 bg-accent text-bg-base"
                      >
                        保存并关闭
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
