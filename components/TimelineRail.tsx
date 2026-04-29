"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { MemoryFrame } from "@/data/demoFrames";

type Props = {
  frames: MemoryFrame[];
};

export default function TimelineRail({ frames }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef({ top: 0, height: 1 });
  const isTooFew = frames.length < 5;

  const updateBounds = useCallback(() => {
    if (railRef.current) {
      const r = railRef.current.getBoundingClientRect();
      boundsRef.current = { top: r.top, height: Math.max(r.height, 1) };
    }
  }, []);

  useEffect(() => {
    updateBounds();
    window.addEventListener("scroll", updateBounds, { passive: true });
    window.addEventListener("resize", updateBounds);
    return () => {
      window.removeEventListener("scroll", updateBounds);
      window.removeEventListener("resize", updateBounds);
    };
  }, [updateBounds, frames]);

  const { scrollY } = useScroll();
  const rawProgress = useTransform(scrollY, (y) => {
    const { top, height } = boundsRef.current;
    const viewportCenter = window.innerHeight / 2;
    const railTopInView = top - y;
    return Math.max(0, Math.min(1, (viewportCenter - railTopInView) / height));
  });

  // Smooth progress via spring — no React state, no per-frame re-render
  const smoothProgress = useSpring(rawProgress, {
    stiffness: 80,
    damping: 25,
    mass: 0.3,
  });

  const margin = 14;
  const scrollDotY = useTransform(
    smoothProgress,
    [0, 1],
    [margin, (boundsRef.current.height || 200) - margin],
  );

  return (
    <div
      ref={railRef}
      className="absolute left-0 top-0 bottom-0 z-10 w-10"
    >
      {/* Rail line */}
      <div
        className="absolute left-[15px] top-[14px] bottom-[14px] w-px"
        style={{
          background: "var(--border-soft)",
          opacity: 0.4,
        }}
      />

      {/* Glow trail behind dot */}
      <motion.div
        className="absolute left-[15px] top-[14px] w-px"
        style={{
          height: scrollDotY,
          background: "linear-gradient(to bottom, var(--accent-glow), var(--border-soft))",
          opacity: 0.75,
        }}
      />

      {/* Glow dot — breathing only when too few frames */}
      <motion.div
        className="absolute left-[15px] z-20 h-[7px] w-[7px] -translate-x-1/2 rounded-full"
        style={{
          top: isTooFew ? "50%" : scrollDotY,
          background: "var(--accent)",
          opacity: 0.7,
          boxShadow: "0 0 6px var(--accent-glow)",
        }}
        animate={isTooFew ? { opacity: [0.3, 0.85, 0.3] } : undefined}
        transition={
          isTooFew
            ? { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      />

      {/* Frame node markers + time labels — only when enough frames */}
      {frames.length >= 5 &&
        frames.map((frame, i) => {
          const fraction = i / (frames.length - 1);
          const y = margin + fraction * ((boundsRef.current.height || 200) - margin * 2);
          return (
            <div key={frame.id} className="absolute left-[15px]" style={{ top: y }}>
              <div
                className="absolute h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: "var(--border-soft)", opacity: 0.6 }}
              />
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[9px]"
                style={{ color: "var(--text-primary)", opacity: 0.1 }}
              >
                {frame.time}
              </span>
            </div>
          );
        })}

      {/* Mirror-gap highlight near dot */}
      <motion.div
        className="absolute left-[15px] w-px"
        style={{
          top: useTransform(scrollDotY, (v) => Math.max(margin, v - 24)),
          height: 48,
          opacity: 0.18,
          background:
            "linear-gradient(to bottom, transparent, var(--accent-glow) 30%, var(--accent-glow) 70%, transparent)",
        }}
      />
    </div>
  );
}
