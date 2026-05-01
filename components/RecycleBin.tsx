"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Undo2, X, AlertTriangle } from "lucide-react";
import { MemoryFrame, formatFrameNumber } from "@/data/demoFrames";

type Props = {
  deletedFrames: MemoryFrame[];
  onRestore: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
};

function daysLeft(deletedAt: string): number {
  const deleted = new Date(deletedAt).getTime();
  const expires = deleted + 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function RecycleBin({ deletedFrames, onRestore, onPermanentlyDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-1.5 text-xs tracking-wider text-text-muted/40 transition-colors hover:text-text-muted/70"
      >
        <Trash2 size={12} />
        <span>回收站</span>
        {deletedFrames.length > 0 && (
          <span
            className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-micro bg-border-soft text-text-muted"
          >
            {deletedFrames.length}
          </span>
        )}
      </button>

      {/* Slide-out panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setOpen(false);
                setConfirmId(null);
              }}
              className="fixed inset-0 z-40 bg-surface-overlay"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l bg-bg-soft border-border-soft"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between border-b px-5 py-4 border-border-soft"
              >
                <div className="flex items-center gap-2">
                  <Trash2 size={14} className="text-text-muted opacity-60" />
                  <span
                    className="font-mono text-xs tracking-[0.15em] text-text-secondary"
                  >
                    回收站
                  </span>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    setConfirmId(null);
                  }}
                  className="flex h-7 w-7 items-center justify-center transition-colors hover:text-text-primary rounded-button text-text-muted"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {deletedFrames.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Trash2 size={24} className="text-text-muted opacity-[0.15] mb-3" />
                    <p className="text-xs tracking-wider text-text-muted opacity-35">
                      回收站是空的
                    </p>
                    <p className="mt-1 text-micro text-text-muted opacity-20">
                      删除的帧会在这里保留 7 天
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deletedFrames
                      .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime())
                      .map((frame) => {
                        const remaining = daysLeft(frame.deletedAt!);
                        return (
                          <motion.div
                            key={frame.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 40 }}
                            className="border px-4 py-3 transition-colors rounded-button border-border-soft bg-bg-base"
                            style={{
                              opacity: confirmId === frame.id ? 1 : 0.7,
                            }}
                          >
                            <div className="mb-1.5 flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p
                                  className="truncate text-xs leading-relaxed text-text-primary opacity-70"
                                >
                                  {frame.content.length > 60
                                    ? frame.content.substring(0, 60) + "…"
                                    : frame.content}
                                </p>
                              </div>
                              <span
                                className="flex-shrink-0 font-mono text-micro text-text-muted opacity-40"
                              >
                                第 {formatFrameNumber(frame.frameIndex)} 帧
                              </span>
                            </div>

                            <div className="mb-2 flex items-center gap-2 text-micro text-text-muted opacity-35">
                              <span>{frame.date} · {frame.time}</span>
                              <span>
                                {remaining === 0
                                  ? "即将清除"
                                  : remaining === 1
                                    ? "还剩 1 天"
                                    : `还剩 ${remaining} 天`}
                              </span>
                            </div>

                            {confirmId === frame.id ? (
                              <div
                                className="flex flex-col gap-1.5 rounded-md border px-3 py-2 border-status-error bg-bg-soft opacity-60"
                              >
                                <div className="flex items-center gap-1.5 text-micro text-status-error opacity-70">
                                  <AlertTriangle size={10} />
                                  立即永久删除？此操作不可撤销。
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setConfirmId(null)}
                                    className="flex-1 rounded py-1 text-micro transition-colors border border-border-soft text-text-muted"
                                  >
                                    取消
                                  </button>
                                  <button
                                    onClick={() => {
                                      onPermanentlyDelete(frame.id);
                                      setConfirmId(null);
                                    }}
                                    className="flex-1 rounded py-1 text-micro transition-colors border border-status-error text-status-error bg-status-error opacity-[0.12]"
                                  >
                                    确认删除
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onRestore(frame.id)}
                                  className="flex flex-1 items-center justify-center gap-1 rounded py-1.5 text-micro transition-colors hover:opacity-80 border border-border-soft text-text-secondary"
                                >
                                  <Undo2 size={10} />
                                  恢复
                                </button>
                                <button
                                  onClick={() => setConfirmId(frame.id)}
                                  className="flex flex-1 items-center justify-center gap-1 rounded py-1.5 text-micro transition-colors border border-border-soft text-text-muted opacity-50"
                                >
                                  永久删除
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Footer note */}
              {deletedFrames.length > 0 && (
                <div
                  className="border-t px-5 py-3 text-center text-micro border-border-soft text-text-muted opacity-25"
                >
                  删除 7 天后自动清除
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
