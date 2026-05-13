"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { MemoryFrame } from "@/data/demoFrames";
import AppHeader from "./AppHeader";
import { useTheme } from "@/hooks/useTheme";
import { themes } from "@/lib/themes";
import { ReflectionStoryOutput, ReflectionCache } from "@/services/ai/types";

type Props = {
  frames: MemoryFrame[];
  onBack: () => void;
  showToast: (message: string) => void;
};

const CACHE_KEY = "jingxi_reflection";
const MIN_FRAMES = 3;
const REGEN_FRAME_DELTA = 3;
const REGEN_DAYS = 7;

function loadCache(): ReflectionCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // v1 旧结构（有 body 无 story）→ 丢弃
    if (parsed && parsed.version === 2 && typeof parsed.story === "string") {
      return parsed as ReflectionCache;
    }
    return null;
  } catch {
    return null;
  }
}

function saveCache(output: ReflectionStoryOutput): void {
  if (typeof window === "undefined") return;
  try {
    const cache: ReflectionCache = { ...output, version: 2 };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // quota exceeded — silently skip
  }
}

function needsRegen(
  cache: ReflectionCache | null,
  currentCount: number
): boolean {
  if (!cache) return true;
  if (Math.abs(cache.basedOnCount - currentCount) >= REGEN_FRAME_DELTA) return true;
  const msSince = Date.now() - cache.generatedAt;
  if (msSince > REGEN_DAYS * 24 * 60 * 60 * 1000) return true;
  return false;
}

// Seeded pseudo-random for stable floating word positions
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type GravityPoint = {
  x: number;
  y: number;
  pressed: boolean;
} | null;

function FloatingFragment({
  word,
  index,
  textColor,
  reducedMotion,
  depth,
  kind,
  gravity,
}: {
  word: string;
  index: number;
  textColor: string;
  reducedMotion: boolean;
  depth: number;
  kind: "word" | "sliver" | "dust";
  gravity: GravityPoint;
}) {
  const config = useMemo(() => {
    const seed = index * 7 + word.length * 13;
    const zones = [
      { left: 8, top: 20 },
      { left: 91, top: 24 },
      { left: 7, top: 56 },
      { left: 92, top: 58 },
      { left: 15, top: 82 },
      { left: 86, top: 84 },
      { left: 31, top: 91 },
      { left: 70, top: 92 },
    ];
    const zone = zones[index % zones.length];
    const sideBias = index % zones.length >= 6 ? 18 : 8;
    const left = zone.left + (seededRandom(seed) - 0.5) * sideBias;
    const top = zone.top + (seededRandom(seed + 1) - 0.5) * 10;
    const driftX = (seededRandom(seed + 2) - 0.5) * (kind === "word" ? 18 : 28);
    const driftY = (seededRandom(seed + 9) - 0.5) * (kind === "word" ? 10 : 16);
    const fallY = 14 + seededRandom(seed + 3) * (kind === "word" ? 18 : 26);
    const dartX = (seededRandom(seed + 10) - 0.5) * (kind === "word" ? 44 : 70);
    const dartY = (seededRandom(seed + 11) - 0.5) * (kind === "word" ? 34 : 58);
    const secondDartX = (seededRandom(seed + 12) - 0.5) * (kind === "word" ? 30 : 54);
    const secondDartY = (seededRandom(seed + 13) - 0.5) * (kind === "word" ? 26 : 44);
    const spriteLike = seededRandom(seed + 14) > (kind === "word" ? 0.68 : 0.42);
    const fontSize = kind === "word" ? 10 + depth * 5 + seededRandom(seed + 4) * 3 : 0;
    const opacity = reducedMotion
      ? 0.04 + depth * 0.05
      : kind === "word"
        ? 0.07 + depth * 0.14
        : kind === "sliver"
          ? 0.035 + depth * 0.06
          : 0.045 + depth * 0.08;
    const duration = spriteLike
      ? 13 + seededRandom(seed + 5) * 10
      : 28 + seededRandom(seed + 5) * 20;
    const rotate = (seededRandom(seed + 6) - 0.5) * 10;
    const width = kind === "sliver" ? 14 + seededRandom(seed + 7) * 28 : 1.5 + seededRandom(seed + 7) * 3;
    const height = kind === "sliver" ? 1 : 1.5 + seededRandom(seed + 8) * 3;
    return {
      left,
      top,
      driftX,
      driftY,
      fallY,
      dartX,
      dartY,
      secondDartX,
      secondDartY,
      spriteLike,
      fontSize,
      opacity,
      duration,
      rotate,
      width,
      height,
    };
  }, [index, word.length, reducedMotion, depth, kind]);

  const gravityOffset = useMemo(() => {
    if (!gravity || reducedMotion) return { x: 0, y: 0, glow: 0 };
    const dx = gravity.x - config.left;
    const dy = gravity.y - config.top;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = gravity.pressed ? 52 : 38;
    if (dist > radius) return { x: 0, y: 0, glow: 0 };
    const pull = (1 - dist / radius) * (gravity.pressed ? 18 : 9) * depth;
    const safeDist = Math.max(dist, 1);
    return {
      x: (dx / safeDist) * pull,
      y: (dy / safeDist) * pull + pull * 0.35,
      glow: 1 - dist / radius,
    };
  }, [config.left, config.top, depth, gravity, reducedMotion]);

  const motionPath = useMemo(() => {
    if (reducedMotion) {
      return {
        x: gravityOffset.x,
        y: gravityOffset.y,
        rotate: config.rotate,
        opacity: gravityOffset.glow > 0 ? Math.min(0.46, config.opacity * (1.8 + gravityOffset.glow)) : config.opacity,
        times: undefined,
      };
    }

    const baseOpacity = gravityOffset.glow > 0
      ? Math.min(0.46, config.opacity * (1.8 + gravityOffset.glow))
      : config.opacity;

    if (config.spriteLike) {
      return {
        x: [
          gravityOffset.x - config.driftX * 0.18,
          gravityOffset.x + config.driftX * 0.18,
          gravityOffset.x + config.dartX,
          gravityOffset.x + config.secondDartX,
          gravityOffset.x + config.driftX * 0.55,
          gravityOffset.x - config.driftX * 0.18,
        ],
        y: [
          gravityOffset.y + config.driftY * 0.4,
          gravityOffset.y + config.fallY * 0.18,
          gravityOffset.y + config.dartY,
          gravityOffset.y + config.secondDartY,
          gravityOffset.y - config.fallY * 0.25,
          gravityOffset.y + config.driftY * 0.4,
        ],
        rotate: [
          config.rotate,
          config.rotate * 0.35,
          -config.rotate * 1.3,
          config.rotate * 1.15,
          -config.rotate * 0.25,
          config.rotate,
        ],
        opacity: [baseOpacity * 0.62, baseOpacity, baseOpacity * 1.2, baseOpacity * 0.72, baseOpacity, baseOpacity * 0.62],
        times: [0, 0.46, 0.52, 0.58, 0.82, 1],
      };
    }

    return {
      x: [
        gravityOffset.x - config.driftX * 0.3,
        gravityOffset.x + config.driftX,
        gravityOffset.x + config.driftX * 0.25,
        gravityOffset.x - config.driftX * 0.3,
      ],
      y: [
        gravityOffset.y + config.driftY,
        gravityOffset.y + config.fallY,
        gravityOffset.y - config.fallY * 0.35,
        gravityOffset.y + config.driftY,
      ],
      rotate: [
        config.rotate,
        -config.rotate * 0.55,
        config.rotate * 0.35,
        config.rotate,
      ],
      opacity: [baseOpacity * 0.78, baseOpacity, baseOpacity * 0.72, baseOpacity * 0.78],
      times: [0, 0.42, 0.74, 1],
    };
  }, [config, gravityOffset, reducedMotion]);

  return (
    <motion.span
      initial={{ opacity: 0, x: 0, y: 0 }}
      aria-hidden="true"
      animate={{
        opacity: motionPath.opacity,
        x: motionPath.x,
        y: motionPath.y,
        rotate: motionPath.rotate,
        filter: gravityOffset.glow > 0 ? "blur(0.3px)" : kind === "word" ? "blur(1.4px)" : "blur(1px)",
      }}
      transition={{
        opacity: reducedMotion
          ? { duration: 0.45 }
          : { duration: config.duration, repeat: Infinity, ease: "easeInOut", times: motionPath.times },
        x: { duration: config.duration, repeat: Infinity, ease: "easeInOut", times: motionPath.times },
        y: { duration: config.duration * (config.spriteLike ? 1 : 1.18), repeat: Infinity, ease: "easeInOut", times: motionPath.times },
        rotate: { duration: config.duration * (config.spriteLike ? 0.92 : 1.45), repeat: Infinity, ease: "easeInOut", times: motionPath.times },
        filter: { duration: 0.45 },
      }}
      style={{
        position: "absolute",
        left: `${config.left}%`,
        top: `${config.top}%`,
        width: kind === "word" ? undefined : config.width,
        height: kind === "word" ? undefined : config.height,
        borderRadius: kind === "dust" ? "999px" : 999,
        background: kind === "word" ? undefined : "currentColor",
        fontSize: config.fontSize,
        color: textColor,
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        fontFamily: "'Noto Serif SC', 'Songti SC', serif",
        letterSpacing: "0.08em",
        zIndex: 1,
        mixBlendMode: "screen",
        transformOrigin: "center",
        textShadow: gravityOffset.glow > 0 ? `0 0 14px currentColor` : undefined,
      }}
    >
      {kind === "word" ? word : null}
    </motion.span>
  );
}

function buildWordFragments(reflection: ReflectionStoryOutput, frames: MemoryFrame[]): string[] {
  const combined = [
    ...reflection.floatingWords,
    ...(reflection.motifs ?? []),
    ...(reflection.mood ?? []),
  ];
  frames.slice(-4).forEach((frame) => combined.push(...frame.tags));
  return [...new Set(combined.filter((word) => word.length >= 2))].slice(0, 10);
}

export default function ReflectionPage({ frames, onBack, showToast }: Props) {
  const { themeId } = useTheme();
  const t = themes[themeId];
  const isLight = themeId === "morning-grey";

  const [reflection, setReflection] = useState<ReflectionStoryOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [gravity, setGravity] = useState<GravityPoint>(null);
  const floatContainerRef = useRef<HTMLDivElement>(null);

  const isEmpty = frames.length < MIN_FRAMES;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const generate = useCallback(
    async (force: boolean) => {
      if (frames.length < MIN_FRAMES) return;

      const cache = loadCache();
      if (!force && !needsRegen(cache, frames.length)) {
        setReflection(cache);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const inputFrames = frames.map((f) => ({
          date: f.date,
          time: f.time,
          content: f.content,
          summary: f.summary,
          tags: f.tags,
          tone: f.tone,
        }));

        const res = await fetch("/api/ai/reflect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frames: inputFrames }),
        });

        if (!res.ok) throw new Error("API error");

        const data = (await res.json()) as ReflectionStoryOutput;
        setReflection(data);
        saveCache(data);
      } catch {
        setError(true);
        const cache = loadCache();
        if (cache) {
          setReflection(cache);
        }
        showToast("镜子另一边暂时无法回应，请稍后再试。");
      } finally {
        setLoading(false);
      }
    },
    [frames, showToast]
  );

  useEffect(() => {
    if (frames.length >= MIN_FRAMES) {
      generate(false);
    }
  }, [frames.length, generate]);

  const allFloatingWords = useMemo(() => {
    if (!reflection) return [];
    return buildWordFragments(reflection, frames);
  }, [frames, reflection]);

  const updateGravity = (e: React.PointerEvent<HTMLDivElement>, pressed = false) => {
    if (reducedMotion || !floatContainerRef.current) return;
    const rect = floatContainerRef.current.getBoundingClientRect();
    setGravity({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      pressed,
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Header ── */}
      <AppHeader title="镜中人" onBack={onBack} backLabel="返回时间胶片" />

      {/* ── Content ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08 }}
        className="flex flex-1 flex-col items-center justify-center relative"
      >
        {/* ── Layer 1: Background (mist) ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isLight
              ? "radial-gradient(ellipse at 50% 50%, rgba(180,170,160,0.12) 0%, transparent 70%)"
              : "radial-gradient(ellipse at 50% 40%, rgba(140,155,180,0.06) 0%, rgba(180,160,120,0.04) 50%, transparent 75%)",
          }}
        />

        {/* ── Layer 2: Floating words ── */}
        {!isEmpty && allFloatingWords.length > 0 && (
          <div
            ref={floatContainerRef}
            className="absolute inset-0 z-0 overflow-hidden"
            style={{ pointerEvents: "auto" }}
            onPointerMove={(e) => updateGravity(e)}
            onPointerDown={(e) => updateGravity(e, true)}
            onPointerUp={(e) => updateGravity(e)}
            onPointerLeave={() => setGravity(null)}
          >
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[62vh] w-[62vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
              animate={reducedMotion ? undefined : { opacity: [0.08, 0.14, 0.08], scale: [0.98, 1.03, 0.98] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background: isLight
                  ? "radial-gradient(circle, rgba(120,95,70,0.035), transparent 66%)"
                  : "radial-gradient(circle, rgba(210,220,235,0.038), transparent 68%)",
                filter: "blur(18px)",
              }}
            />
            {allFloatingWords.map((word, i) => {
              const depthSeed = seededRandom(i * 17 + word.length * 5);
              const depth = 0.34 + depthSeed * 0.44;
              return (
                <FloatingFragment
                  key={`${word}-${i}`}
                  word={word}
                  index={i}
                  textColor={t.textPrimary}
                  reducedMotion={reducedMotion}
                  depth={depth}
                  kind="word"
                  gravity={gravity}
                />
              );
            })}
            {Array.from({ length: 16 }).map((_, i) => {
              const depth = 0.12 + seededRandom(i * 31) * 0.5;
              return (
                <FloatingFragment
                  key={`dust-${i}`}
                  word=""
                  index={i + 80}
                  textColor={t.textPrimary}
                  reducedMotion={reducedMotion}
                  depth={depth}
                  kind={i % 3 === 0 ? "sliver" : "dust"}
                  gravity={gravity}
                />
              );
            })}
          </div>
        )}

        {isEmpty ? (
          /* ── Empty state ── */
          <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
            <div
              className="text-4xl select-none opacity-50"
              style={{ filter: "blur(1px)" }}
            >
              <Sparkles size={40} strokeWidth={1} />
            </div>
            <div className="space-y-2">
              <p
                className="text-sm leading-relaxed tracking-[0.05em]"
                style={{ color: t.textPrimary, opacity: 0.55 }}
              >
                时间流动中。
                <br />
                再多几帧，镜中人会浮现。
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-2 rounded-full text-xs tracking-[0.1em] transition-all"
              style={{
                backgroundColor: t.accentSoft,
                color: t.bgBase,
                opacity: 0.7,
              }}
            >
              去记录
            </button>
          </div>
        ) : loading && !reflection ? (
          /* ── Loading state ── */
          <div className="relative z-10 w-full max-w-[420px] px-5 sm:px-0">
            <div
              className="rounded-xl px-6 py-8 sm:px-8 sm:py-10 animate-pulse"
              style={{
                backgroundColor: isLight
                  ? "rgba(255,255,255,0.45)"
                  : "rgba(255,255,255,0.04)",
              }}
            >
              <div className="space-y-4">
                <div
                  className="h-3 w-2/3 rounded"
                  style={{ backgroundColor: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)" }}
                />
                <div
                  className="h-3 w-full rounded"
                  style={{ backgroundColor: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)" }}
                />
                <div
                  className="h-3 w-5/6 rounded"
                  style={{ backgroundColor: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)" }}
                />
                <div
                  className="h-3 w-3/4 rounded"
                  style={{ backgroundColor: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)" }}
                />
              </div>
            </div>
            <p
              className="text-center text-xs mt-4 tracking-[0.05em]"
              style={{ color: t.textPrimary, opacity: 0.3 }}
            >
              正在映出镜中人...
            </p>
          </div>
        ) : (
          /* ── Story layer ── */
          <div className="relative z-10 w-full max-w-[420px] px-5 sm:px-0">
            {/* ── Layer 3: Story ── */}
            <p
              className="text-center text-xs mb-3 tracking-[0.12em]"
              style={{ color: t.textPrimary, opacity: 0.3 }}
            >
              一则侧影
            </p>

            <div
              className="rounded-xl px-6 py-8 sm:px-8 sm:py-10"
              style={{
                backgroundColor: isLight
                  ? "rgba(255,255,255,0.66)"
                  : "rgba(19,22,26,0.68)",
                border: isLight
                  ? "1px solid rgba(0,0,0,0.05)"
                  : "1px solid rgba(255,255,255,0.07)",
                boxShadow: isLight
                  ? "0 18px 60px rgba(70,55,40,0.08)"
                  : "0 18px 70px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                className="mb-8"
                style={{
                  fontFamily: "'Noto Serif SC', 'Songti SC', serif",
                  fontSize: 15,
                  lineHeight: 2,
                  letterSpacing: "0.04em",
                  color: t.textPrimary,
                  whiteSpace: "pre-wrap",
                }}
              >
                {reflection?.story || "镜子里暂时一片雾。"}
              </div>
            </div>

            {/* ── Layer 4: Clues ── */}
            {reflection?.motifs && reflection.motifs.length > 0 && (
              <p
                className="text-center text-xs mt-4 tracking-[0.06em]"
                style={{ color: t.textPrimary, opacity: 0.28 }}
              >
                浮出的词：{reflection.motifs.join(" / ")}
              </p>
            )}
            <p
              className="text-center text-xs mt-2 tracking-[0.05em]"
              style={{ color: t.textPrimary, opacity: 0.2 }}
            >
              来自最近 {reflection?.basedOnCount || frames.length} 帧
            </p>

            {/* Action button */}
            <div className="flex items-center justify-center mt-6">
              <button
                onClick={() => generate(true)}
                disabled={loading}
                className="px-6 py-2 rounded-full text-xs tracking-[0.08em] transition-all hover:opacity-80 disabled:opacity-40"
                style={{
                  backgroundColor: t.accentSoft,
                  color: t.bgBase,
                  opacity: 0.7,
                }}
              >
                {loading ? "生成中..." : "重新映出"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
