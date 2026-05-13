"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { MemoryFrame, formatFrameNumber } from "@/data/demoFrames";
import { Eye, Type, Mic } from "lucide-react";

type Props = {
  frame: MemoryFrame;
  index: number;
  onClick: () => void;
  isMobile: boolean;
};

function MemoryCardInner({ frame, index, onClick, isMobile }: Props) {

  const STATUS_LABEL: Record<MemoryFrame["status"], string> = {
    saved: "已保存",
    organizing: "整理中",
    developing: "显影中",
  };

  const defaultBorderLeft =
    frame.status === "organizing"
      ? "var(--accent-glow)"
      : frame.status === "developing"
        ? "var(--border-soft)"
        : "var(--border-soft)";

  const cardOpacity = frame.status === "organizing" ? 0.85 : 1;

  const statusColor =
    frame.status === "saved" ? "var(--text-muted)"
    : frame.status === "organizing" ? "var(--accent-soft)"
    : "var(--accent-glow)";

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1],
      }}
      onClick={onClick}
      className="group relative cursor-pointer border border-border-subtle bg-bg-card py-4 pl-4 pr-4 transition-colors active:scale-[0.98] paper-grain rounded-card"
      style={{
        borderLeftColor: defaultBorderLeft,
        transitionProperty: "all, border-left-color",
        opacity: cardOpacity,
      }}
      whileHover={isMobile ? undefined : { y: -2, borderLeftColor: "var(--border-active)", opacity: 1, boxShadow: "0 4px 24px var(--accent-glow)" }}
    >
      {/* Time + frame number */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-micro tracking-wider text-text-muted">
          {frame.date} · {frame.time}
        </span>
        <span className="font-mono text-micro text-text-muted/50">
          第 {formatFrameNumber(frame.frameIndex)} 帧
        </span>
      </div>

      {/* User's text — visual focus */}
      <p className="mb-3 line-clamp-4 font-serif text-base leading-relaxed whitespace-pre-wrap text-text-primary">
        {frame.content}
      </p>

      {/* AI Summary — subtle annotation */}
      <p className={`mb-3 text-xs leading-relaxed ${frame.summary ? "text-text-muted/50" : "text-text-muted/20 italic"}`}>
        {frame.summary || "请静候时光沉淀…"}
      </p>

      {/* Tags */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {frame.tags.map((tag) => (
          <span
            key={tag}
            className="border border-border-subtle bg-transparent px-2 py-0.5 text-micro text-text-muted"
            style={{ borderRadius: "3px" }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer: metadata + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-micro text-text-muted/50">
          <span className="flex items-center gap-1">
            {frame.type === "voice" ? <Mic size={10} /> : <Type size={10} />}
            {frame.type === "voice"
              ? `语音 · ${frame.duration}`
              : `文本 · ${frame.wordCount} 字`}
          </span>
          <span style={{ color: statusColor }}>{STATUS_LABEL[frame.status]}</span>
        </div>

        <span className="flex items-center gap-1 text-micro text-text-muted/30 opacity-0 transition-opacity group-hover:opacity-100">
          <Eye size={10} />
          查看
        </span>
      </div>
    </motion.article>
  );
}

function arePropsEqual(prev: Props, next: Props) {
  return (
    prev.frame.id === next.frame.id &&
    prev.frame.content === next.frame.content &&
    prev.frame.summary === next.frame.summary &&
    prev.frame.status === next.frame.status &&
    prev.index === next.index &&
    prev.isMobile === next.isMobile
  );
}

const MemoryCard = memo(MemoryCardInner, arePropsEqual);
export default MemoryCard;
