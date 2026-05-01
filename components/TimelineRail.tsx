"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { MemoryFrame } from "@/data/demoFrames";
import DevelopingDot from "./DevelopingDot";

type Props = {
  frames: MemoryFrame[];
};

export default function TimelineRail({ frames }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef({ top: 0, height: 1 });
  const [railHeight, setRailHeight] = useState(200);
  const isTooFew = frames.length < 3;
  const prevCountRef = useRef(frames.length);
  const [arriving, setArriving] = useState(false);

  // Detect new frame added → brief arrival animation
  useEffect(() => {
    if (frames.length > prevCountRef.current) {
      setArriving(true);
      const t = setTimeout(() => setArriving(false), 1000);
      prevCountRef.current = frames.length;
      return () => clearTimeout(t);
    }
    prevCountRef.current = frames.length;
  }, [frames.length]);

  const updateBounds = useCallback(() => {
    if (railRef.current) {
      const r = railRef.current.getBoundingClientRect();
      const h = Math.max(r.height, 1);
      boundsRef.current = { top: r.top, height: h };
      setRailHeight(h);
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

  const smoothProgress = useSpring(rawProgress, {
    stiffness: 60,
    damping: 28,
    mass: 0.5,
  });

  const margin = 14;
  const scrollDotY = useTransform(
    smoothProgress,
    [0, 1],
    [margin, (boundsRef.current.height || 200) - margin],
  );

  return (
    <div ref={railRef} className="absolute left-0 top-0 bottom-0 z-10 w-10">
      {/* Rail line */}
      <div
        className="absolute left-[15px] top-[14px] bottom-[14px] w-px"
        style={{ background: "var(--border-soft)", opacity: 0.35 }}
      />

      {/* Glow trail behind the developing dot */}
      {!isTooFew && (
        <motion.div
          className="absolute left-[15px] top-[14px] w-px"
          style={{
            height: scrollDotY,
            background:
              "linear-gradient(to bottom, var(--accent-glow), var(--border-soft))",
            opacity: 0.55,
          }}
        />
      )}

      {/* Developing dot — the current time position */}
      <motion.div
        className="absolute left-[15px] z-20 -translate-x-1/2"
        style={{ top: scrollDotY }}
      >
        <DevelopingDot
          arriving={arriving}
          className={isTooFew ? "opacity-30" : ""}
        />
      </motion.div>

      {/* Frame node markers — minimal dots, no labels when space is tight */}
      {frames.length >= 3 &&
        useMemo(() => {
          const labelMinGap = 24;
          const entries: { frame: MemoryFrame; y: number; showLabel: boolean }[] = [];
          let lastLabelY = -labelMinGap;

          for (let i = 0; i < frames.length; i++) {
            const fraction = i / (frames.length - 1);
            const y =
              margin + fraction * ((boundsRef.current.height || 200) - margin * 2);
            const showLabel =
              i === 0 || i === frames.length - 1 || y - lastLabelY >= labelMinGap;
            if (showLabel) lastLabelY = y;
            entries.push({ frame: frames[i], y, showLabel });
          }

          return entries.map(({ frame, y, showLabel }) => (
            <div key={frame.id} className="absolute left-[15px]" style={{ top: y }}>
              <div
                className="absolute h-[2.5px] w-[2.5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: "var(--border-soft)", opacity: 0.45 }}
              />
              {showLabel && (
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-micro"
                  style={{ color: "var(--text-primary)", opacity: 0.08 }}
                >
                  {frame.time}
                </span>
              )}
            </div>
          ));
        }, [frames, railHeight])}

      {/* Mirror-gap highlight near dot — very subtle */}
      <motion.div
        className="absolute left-[15px] w-px"
        style={{
          top: useTransform(scrollDotY, (v) => Math.max(margin, v - 28)),
          height: 56,
          opacity: 0.12,
          background:
            "linear-gradient(to bottom, transparent, var(--accent-glow) 25%, var(--accent-glow) 75%, transparent)",
        }}
      />
    </div>
  );
}
