"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MemoryFrame, formatFrameNumber } from "@/data/demoFrames";
import { X, Copy, Type, Mic, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

type Props = {
  frame: MemoryFrame | null;
  onClose: () => void;
  onDelete: (id: string) => void;
};

const STATUS_LABEL: Record<MemoryFrame["status"], string> = {
  saved: "已保存",
  organizing: "整理中",
  developing: "显影中",
};

export default function FrameDetailOverlay({ frame, onClose, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Reset state when switching between frames
  useEffect(() => {
    setConfirmingDelete(false);
    setExpanded(false);
    setCopied(null);
  }, [frame?.id]);

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

  const statusColor =
    frame?.status === "saved" ? "var(--text-muted)"
    : frame?.status === "organizing" ? "var(--accent-soft)"
    : "var(--accent-glow)";

  const contentText = frame?.content ?? "";
  const isLong = contentText.length > 200;

  return (
    <AnimatePresence>
      {frame && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto px-5 py-20 backdrop-blur-sm"
          style={{ background: "var(--surface-overlay)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-app border border-border-subtle p-6"
            style={{
              borderRadius: "8px",
              borderLeftColor: "var(--border-warm)",
              borderLeftWidth: "1px",
              background: "var(--bg-soft)",
            }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center border border-border-subtle text-text-muted transition-colors hover:text-text-primary"
              style={{ borderRadius: "8px" }}
            >
              <X size={14} />
            </button>

            {/* Header */}
            <div className="mb-5 flex items-start justify-between pr-10">
              <div>
                <div className="font-mono text-xs tracking-wider text-text-secondary">
                  {frame.date} · {frame.time}
                </div>
                <div className="mt-1 font-mono text-[10px] text-text-muted/50">
                  第 {formatFrameNumber(frame.frameIndex)} 帧
                </div>
                <div className="mt-1 font-mono text-[10px] text-text-muted/30">
                  创建于 {frame.createdAt}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: statusColor }}>
                <span className="flex items-center gap-1">
                  {frame.type === "voice" ? <Mic size={10} /> : <Type size={10} />}
                  {frame.type === "voice"
                    ? `语音 · ${frame.duration}`
                    : `文本 · ${frame.wordCount} 字`}
                </span>
                <span>{STATUS_LABEL[frame.status]}</span>
              </div>
            </div>

            {/* Full content */}
            <div className="mb-5">
              <p
                className={`text-base leading-relaxed text-text-primary ${
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
            </div>

            {/* Summary */}
            <div
              className="mb-5 border border-border-subtle px-4 py-3"
              style={{ borderRadius: "8px", background: "var(--bg-base)", opacity: 0.6 }}
            >
              <p className="text-xs leading-relaxed text-text-muted/50">
                {frame.summary}
              </p>
            </div>

            {/* Tags */}
            <div className="mb-5 flex flex-wrap gap-1.5">
              {frame.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-border-subtle bg-transparent px-2.5 py-0.5 text-[10px] text-text-muted"
                  style={{ borderRadius: "3px" }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            {confirmingDelete ? (
              <div
                className="flex flex-col gap-2 border px-4 py-3"
                style={{ borderRadius: "8px", borderColor: "var(--border-warm)", background: "var(--bg-base)", opacity: 0.6 }}
              >
                <p className="text-center text-xs text-text-muted/60">
                  移入回收站？7 天后自动清除。
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="flex-1 border border-border-subtle py-2 text-xs text-text-muted transition-colors hover:text-text-secondary"
                    style={{ borderRadius: "8px" }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 text-xs transition-colors hover:opacity-80"
                    style={{
                      borderRadius: "8px",
                      border: "1px solid var(--status-error)",
                      color: "var(--status-error)",
                      background: "var(--status-error)",
                      opacity: 0.15,
                    }}
                  >
                    确认删除
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(frame.content, "已复制原文")}
                  className="flex flex-1 items-center justify-center gap-1.5 border border-border-subtle py-2 text-xs transition-colors hover:border-border-subtle/80 hover:text-text-primary active:scale-95"
                  style={{ borderRadius: "8px", color: copied === "已复制原文" ? "var(--accent)" : undefined }}
                >
                  <Copy size={12} />
                  {copied === "已复制原文" ? "已复制" : "复制原文"}
                </button>
                <button
                  onClick={() => handleCopy(frame.summary, "已复制摘要")}
                  className="flex flex-1 items-center justify-center gap-1.5 border border-border-subtle py-2 text-xs transition-colors hover:border-border-subtle/80 hover:text-text-primary active:scale-95"
                  style={{ borderRadius: "8px", color: copied === "已复制摘要" ? "var(--accent)" : undefined }}
                >
                  <Copy size={12} />
                  {copied === "已复制摘要" ? "已复制" : "复制摘要"}
                </button>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-border-subtle transition-colors hover:border-status-error/30"
                  style={{ borderRadius: "8px", color: "var(--text-muted)", opacity: 0.4 }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
