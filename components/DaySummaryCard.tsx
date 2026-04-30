"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { MemoryFrame } from "@/data/demoFrames";

type Props = {
  date: string;
  frameCount: number;
  topTags: string[];
  frames: MemoryFrame[];
};

const STOP_WORDS = new Set([
  "今天", "昨天", "刚才", "刚刚", "现在", "好像", "觉得", "感觉", "可能",
  "应该", "真的", "有点", "比较", "非常", "特别", "确实", "其实", "然后",
  "之后", "以前", "不过", "虽然", "但是", "因为", "所以", "而且", "或者",
  "也许", "大概", "一直", "总是", "突然", "终于", "后来", "这个", "那个",
  "我们", "他们", "你们", "自己", "什么", "怎么", "为什么", "没有", "可以",
  "还是", "只是", "就是", "不是", "已经", "还会", "一个", "一下", "一些",
  "一种", "一次", "一点", "很多", "很少", "起来", "过来", "出去", "回来",
  "时候", "知道", "看到", "听到", "想到", "这种", "那种", "这样", "那样",
]);

function generateMainThread(frames: MemoryFrame[], topTags: string[]): string | null {
  if (frames.length === 0) return null;
  if (frames.length === 1) return "今天只留下了一帧";

  // Count tag frequency across all frames
  const tagCounts = new Map<string, number>();
  for (const f of frames) {
    for (const t of f.tags) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }
  }

  // Check if top tag is concentrated (appears in ≥60% of frames)
  const threshold = frames.length * 0.6;
  for (const tag of topTags) {
    const count = tagCounts.get(tag) || 0;
    if (count >= threshold) {
      return `今天的关键词是「${tag}」`;
    }
  }

  // Extract 2-grams from all content, filter stop words
  const bigramCounts = new Map<string, number>();
  for (const f of frames) {
    const text = f.content.replace(/[，。！？、；：""''（）\s\n]/g, "");
    for (let i = 0; i < text.length - 1; i++) {
      const bigram = text.substring(i, i + 2);
      if (/^[一-鿿]{2}$/.test(bigram) && !STOP_WORDS.has(bigram)) {
        bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
      }
    }
  }

  // Find top bigram
  let topBigram = "";
  let topBigramCount = 0;
  for (const [word, count] of bigramCounts) {
    if (count > topBigramCount) {
      topBigram = word;
      topBigramCount = count;
    }
  }

  if (topBigram && topBigramCount >= 2) {
    return `今天似乎围绕着「${topBigram}」展开`;
  }

  return null;
}

export default function DaySummaryCard({ date, frameCount, topTags, frames }: Props) {
  const mainThread = useMemo(() => generateMainThread(frames, topTags), [frames, topTags]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      className="relative mb-8 overflow-hidden border border-border-subtle bg-bg-soft/40 px-6 py-5"
      style={{ borderRadius: "8px", background: "var(--surface-1)" }}
    >
      {/* Left accent — mirror-gap hint */}
      <div
        className="absolute left-0 top-3 bottom-3 w-px"
        style={{ background: "var(--border-warm)" }}
      />

      {/* Date line */}
      <div className="mb-4 font-mono text-sm tracking-[0.15em] text-text-primary">
        {date}
      </div>

      {/* Frame count — the focal line */}
      <p className="mb-1 text-base leading-relaxed tracking-wider text-text-secondary">
        你留下了 {frameCount} 帧。
      </p>

      {/* Main thread — one-line summary */}
      {mainThread && (
        <p className="mb-4 text-sm leading-relaxed tracking-wider text-text-muted">
          {mainThread}
        </p>
      )}

      {/* Subtle divider */}
      <div
        className="mb-4 h-px w-full"
        style={{ background: "var(--border-soft)" }}
      />

      {/* Recurring words */}
      {topTags.length > 0 && (
        <p className="text-xs leading-relaxed tracking-wider text-text-muted">
          今天反复出现的词：{topTags.join(" / ")}
        </p>
      )}
    </motion.div>
  );
}
