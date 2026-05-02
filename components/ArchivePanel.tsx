"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Archive, X, FileJson, FileText, File as FileIcon, Check, Download, Image } from "lucide-react";
import { MemoryFrame, formatFrameNumber } from "@/data/demoFrames";
import { toJSON, toMarkdown, toTXT, type ExportOptions } from "@/lib/exportFrames";
import { shareOrDownload } from "@/lib/exportImage";
import { useTheme } from "@/hooks/useTheme";
import useIsMobile from "@/hooks/useIsMobile";
import FrameImageExport, { ImageExportHandle } from "./FrameImageExport";
import FrameCollectionImageExport, { CollectionExportHandle } from "./FrameCollectionImageExport";

type Props = {
  frames: MemoryFrame[];
  onOpenChange?: (open: boolean) => void;
};

function groupByDate(frames: MemoryFrame[]): Map<string, MemoryFrame[]> {
  const map = new Map<string, MemoryFrame[]>();
  for (const f of frames) {
    const list = map.get(f.date);
    if (list) list.push(f);
    else map.set(f.date, [f]);
  }
  return map;
}

const EXPORT_BTNS = [
  { label: "JSON", icon: <FileJson size={10} />, fn: toJSON },
  { label: "MD", icon: <FileText size={10} />, fn: toMarkdown },
  { label: "TXT", icon: <FileIcon size={10} />, fn: toTXT },
];

const OPTION_LABELS: { key: keyof ExportOptions; label: string }[] = [
  { key: "content", label: "文本" },
  { key: "tags", label: "标签" },
  { key: "summary", label: "摘要" },
];

export default function ArchivePanel({ frames, onOpenChange }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportOpts, setExportOpts] = useState<ExportOptions>({ content: true, tags: true, summary: true });
  const [exportingImage, setExportingImage] = useState(false);
  const [exportingCollection, setExportingCollection] = useState(false);
  const [exportingAllImage, setExportingAllImage] = useState(false);
  const exportRef = useRef<ImageExportHandle>(null);
  const collectionRef = useRef<CollectionExportHandle>(null);
  const overviewSingleRef = useRef<ImageExportHandle>(null);
  const overviewCollectionRef = useRef<CollectionExportHandle>(null);
  const { themeId } = useTheme();
  const isMobile = useIsMobile();

  const MAX_COLLECTION_FRAMES = 8;

  const toggleOption = (key: keyof ExportOptions) => {
    setExportOpts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const grouped = useMemo(() => {
    const map = groupByDate(frames);
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [frames]);

  const allIds = useMemo(() => new Set(frames.map((f) => f.id)), [frames]);
  const allSelected = selectedIds.size > 0 && selectedIds.size === allIds.size;

  const selectedFrames = useMemo(
    () => frames.filter((f) => selectedIds.has(f.id)),
    [frames, selectedIds],
  );

  const dates = useMemo(() => [...grouped.keys()], [grouped]);
  const dateRange = dates.length > 0
    ? `${dates[dates.length - 1]} - ${dates[0]}`
    : "";

  const toggleFrame = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  };

  const toggleDate = (date: string, dateIds: Set<string>) => {
    const dateSelected = [...dateIds].every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (dateSelected) {
      for (const id of dateIds) next.delete(id);
    } else {
      for (const id of dateIds) next.add(id);
    }
    setSelectedIds(next);
  };

  const singleFrame = selectedIds.size === 1 ? frames.find((f) => selectedIds.has(f.id)) ?? null : null;
  const collectionFrames = selectedFrames;

  const handleExportImage = async () => {
    if (!singleFrame || exportingImage || !exportRef.current) return;
    setExportingImage(true);
    try {
      const blob = await exportRef.current.renderToBlob();
      const filename = `jingxi-frame-${singleFrame.date}-${singleFrame.time.replace(":", "")}.png`;
      await shareOrDownload(blob, filename, isMobile);
    } catch {
      // error silently — toast handled upstream if needed
    } finally {
      setExportingImage(false);
    }
  };

  const handleExportCollection = async () => {
    if (collectionFrames.length === 0 || exportingCollection || !collectionRef.current) return;
    if (collectionFrames.length > MAX_COLLECTION_FRAMES) return;
    setExportingCollection(true);
    try {
      const blob = await collectionRef.current.renderToBlob();
      const filename = `jingxi-archive-${collectionFrames[0].date}.png`;
      await shareOrDownload(blob, filename, isMobile);
    } catch {
      // error silently
    } finally {
      setExportingCollection(false);
    }
  };

  const handleExportAllImage = async () => {
    if (frames.length === 0 || exportingAllImage) return;
    if (frames.length === 1 && overviewSingleRef.current) {
      setExportingAllImage(true);
      try {
        const blob = await overviewSingleRef.current.renderToBlob();
        const f = frames[0];
        const filename = `jingxi-frame-${f.date}-${f.time.replace(":", "")}.png`;
        await shareOrDownload(blob, filename, isMobile);
      } catch {
      } finally {
        setExportingAllImage(false);
      }
    } else if (frames.length <= MAX_COLLECTION_FRAMES && overviewCollectionRef.current) {
      setExportingAllImage(true);
      try {
        const blob = await overviewCollectionRef.current.renderToBlob();
        const filename = `jingxi-archive-${frames[0].date}.png`;
        await shareOrDownload(blob, filename, isMobile);
      } catch {
      } finally {
        setExportingAllImage(false);
      }
    }
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => { setOpen(true); onOpenChange?.(true); }}
        className="flex items-center gap-1.5 text-sm tracking-wider text-text-muted/50 transition-colors hover:text-text-muted/80"
      >
        <Archive size={14} />
        <span className="hidden sm:inline">档案</span>
      </button>

      {/* Overlay + Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => { setOpen(false); setSelectedIds(new Set()); onOpenChange?.(false); }}
              className="fixed inset-0 z-[55]"
              style={{ background: "color-mix(in srgb, var(--bg-base) 70%, transparent)" }}
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-[360px] flex-col border-l border-border-soft bg-bg-base shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
                <h2 className="font-serif text-base font-medium tracking-wider text-text-primary">档案</h2>
                <button
                  onClick={() => { setOpen(false); setSelectedIds(new Set()); onOpenChange?.(false); }}
                  className="flex h-12 w-12 items-center justify-center rounded-full text-text-muted/50 transition-colors hover:text-text-secondary"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Select all + count */}
              <div className="flex items-center justify-between border-b border-border-soft px-5 py-3">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-xs text-text-muted transition-colors hover:text-text-secondary"
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center border transition-colors"
                    style={{
                      borderRadius: "3px",
                      borderColor: allSelected ? "var(--accent)" : "var(--border-soft)",
                      background: allSelected ? "var(--accent)" : "transparent",
                    }}
                  >
                    {allSelected && <Check size={10} style={{ color: "var(--bg-base)" }} />}
                  </span>
                  {allSelected ? "取消全选" : "全选"}
                </button>
                <span className="text-xs text-text-muted/50">
                  {selectedIds.size > 0 ? `已选 ${selectedFrames.length} 帧` : `共 ${frames.length} 帧`}
                </span>
              </div>

              {/* Scrollable content */}
              <div
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {frames.length === 0 ? (
                  <div className="py-16 text-center text-xs text-text-muted/50">暂无记录</div>
                ) : (
                  <>
                    {/* ── All records overview ── */}
                    <div className="mb-4 border border-border-soft pb-3 rounded-button bg-surface-1">
                      <div className="px-4 pt-3 pb-2">
                        <h3 className="text-sm font-medium tracking-wider text-text-secondary">全部记录</h3>
                        <p className="mt-1 text-xs text-text-muted/60">
                          共 {frames.length} 帧 · {dateRange}
                        </p>
                      </div>
                      {/* Export content options */}
                      <div className="mb-2 flex items-center gap-3 px-4">
                        {OPTION_LABELS.map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => toggleOption(key)}
                            className="flex items-center gap-1.5 text-micro text-text-muted/40 transition-colors hover:text-text-muted/70"
                          >
                            <span
                              className="flex h-4 w-4 items-center justify-center border transition-colors"
                              style={{
                                borderRadius: "3px",
                                borderColor: exportOpts[key] ? "var(--accent)" : "var(--border-soft)",
                                background: exportOpts[key] ? "var(--accent)" : "transparent",
                              }}
                            >
                              {exportOpts[key] && <Check size={8} style={{ color: "var(--bg-base)" }} />}
                            </span>
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1.5 px-4">
                        {EXPORT_BTNS.map(({ label, icon, fn }) => (
                          <button
                            key={label}
                            onClick={() => fn(frames, exportOpts)}
                            className="flex items-center gap-1 rounded border border-border-soft bg-bg-base px-2.5 py-1 text-micro text-text-muted transition-colors hover:border-accent/20 hover:text-text-secondary"
                          >
                            {icon}
                            {label}
                          </button>
                        ))}
                        <button
                          onClick={handleExportAllImage}
                          disabled={exportingAllImage || frames.length === 0 || frames.length > MAX_COLLECTION_FRAMES}
                          title={frames.length > MAX_COLLECTION_FRAMES ? `长图导出最多支持 ${MAX_COLLECTION_FRAMES} 帧` : undefined}
                          className="flex items-center gap-1 rounded border border-accent/20 bg-accent/5 px-2.5 py-1 text-micro text-accent/60 transition-colors hover:border-accent/35 hover:text-accent/80 disabled:opacity-30"
                        >
                          <Image size={10} />
                          {exportingAllImage ? "导出中…" : frames.length > MAX_COLLECTION_FRAMES ? `≤${MAX_COLLECTION_FRAMES}帧` : "PNG"}
                        </button>
                      </div>
                    </div>

                    {/* ── Per-date groups ── */}
                    <div className="space-y-4">
                      {grouped.map(([date, dayFrames]) => {
                        const dateIds = new Set(dayFrames.map((f) => f.id));
                        const dateChecked = dayFrames.length > 0 && dayFrames.every((f) => selectedIds.has(f.id));

                        return (
                          <div key={date} className="space-y-1.5">
                            {/* Date header with group checkbox */}
                            <button
                              onClick={() => toggleDate(date, dateIds)}
                              className="flex w-full items-center gap-2 px-1 text-left"
                            >
                              <span
                                className="flex h-4 w-4 flex-shrink-0 items-center justify-center border transition-colors"
                                style={{
                                  borderRadius: "3px",
                                  borderColor: dateChecked ? "var(--accent)" : "var(--border-soft)",
                                  background: dateChecked ? "var(--accent)" : "transparent",
                                }}
                              >
                                {dateChecked && <Check size={9} style={{ color: "var(--bg-base)" }} />}
                              </span>
                              <span className="font-mono text-sm tracking-[0.1em] text-text-secondary">{date}</span>
                              <span className="text-micro text-text-muted/40">{dayFrames.length} 帧</span>
                            </button>

                            {/* Individual frame cards */}
                            <div className="space-y-1.5 pl-6">
                              {dayFrames.map((f) => {
                                const checked = selectedIds.has(f.id);
                                return (
                                  <button
                                    key={f.id}
                                    onClick={() => toggleFrame(f.id)}
                                    className="flex w-full items-start gap-2 rounded px-2.5 py-2 text-left transition-colors"
                                    style={{
                                      borderRadius: "5px",
                                      background: checked ? "var(--surface-2)" : "var(--surface-1)",
                                      border: checked ? "1px solid var(--border-active)" : "1px solid var(--border-soft)",
                                    }}
                                  >
                                    <span
                                      className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center border transition-colors"
                                      style={{
                                        borderRadius: "3px",
                                        borderColor: checked ? "var(--accent)" : "var(--border-soft)",
                                        background: checked ? "var(--accent)" : "transparent",
                                      }}
                                    >
                                      {checked && <Check size={9} style={{ color: "var(--bg-base)" }} />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-baseline justify-between gap-2">
                                        <span className="font-mono text-micro text-text-muted/50">{f.time}</span>
                                        {f.tags.length > 0 && (
                                          <span className="truncate text-micro text-text-muted/40">
                                            {f.tags.slice(0, 3).join(" / ")}
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-0.5 text-xs leading-relaxed whitespace-pre-wrap text-text-muted/70 line-clamp-3">
                                        {f.content}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Bottom bar — export selected */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 border-t border-border-soft px-5 py-3">
                  <Download size={12} className="text-text-muted/50" />
                  <span className="flex-1 text-xs text-text-muted/60">
                    导出已选 {selectedFrames.length} 帧
                  </span>
                  <div className="flex gap-1.5">
                    {EXPORT_BTNS.map(({ label, icon, fn }) => (
                      <button
                        key={label}
                        onClick={() => fn(selectedFrames, exportOpts)}
                        className="flex items-center gap-1 rounded border border-accent/30 bg-accent/10 px-2.5 py-1 text-micro transition-colors hover:bg-accent/20 text-accent"
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                    {selectedFrames.length === 1 && (
                      <button
                        onClick={handleExportImage}
                        disabled={exportingImage}
                        className="flex items-center gap-1 rounded border border-accent/30 bg-accent/10 px-2.5 py-1 text-micro transition-colors hover:bg-accent/20 text-accent disabled:opacity-40"
                      >
                        <Image size={10} />
                        {exportingImage ? "导出中…" : "PNG"}
                      </button>
                    )}
                    {selectedFrames.length >= 2 && selectedFrames.length <= MAX_COLLECTION_FRAMES && (
                      <button
                        onClick={handleExportCollection}
                        disabled={exportingCollection}
                        className="flex items-center gap-1 rounded border border-accent/30 bg-accent/10 px-2.5 py-1 text-micro transition-colors hover:bg-accent/20 text-accent disabled:opacity-40"
                      >
                        <Image size={10} />
                        {exportingCollection ? "导出中…" : `长图(${selectedFrames.length})`}
                      </button>
                    )}
                    {selectedFrames.length > MAX_COLLECTION_FRAMES && (
                      <span
                        className="text-micro text-text-muted/40 px-1"
                        title={`长图导出最多支持 ${MAX_COLLECTION_FRAMES} 帧`}
                      >
                        长图≤{MAX_COLLECTION_FRAMES}帧
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Hidden export cards — selection-based */}
              {singleFrame && (
                <FrameImageExport ref={exportRef} frame={singleFrame} themeId={themeId} />
              )}
              {selectedFrames.length >= 2 && selectedFrames.length <= MAX_COLLECTION_FRAMES && (
                <FrameCollectionImageExport ref={collectionRef} frames={collectionFrames} themeId={themeId} />
              )}

              {/* Hidden export cards — overview (all frames) */}
              {frames.length === 1 && (
                <FrameImageExport ref={overviewSingleRef} frame={frames[0]} themeId={themeId} />
              )}
              {frames.length >= 2 && frames.length <= MAX_COLLECTION_FRAMES && (
                <FrameCollectionImageExport ref={overviewCollectionRef} frames={frames} themeId={themeId} />
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
