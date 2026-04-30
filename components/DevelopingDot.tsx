"use client";

import { motion, type Transition, type TargetAndTransition } from "framer-motion";

type Props = {
  /** When true, plays a one-shot arrival animation (new frame just saved) */
  arriving?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const BREATH: TargetAndTransition = {
  opacity: [0.2, 0.5, 0.2],
  transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
};

const ARRIVE: TargetAndTransition = {
  scale: [0, 1.15, 1],
  opacity: [0, 0.8, 0.5],
};

const ARRIVE_TRANSITION: Transition = {
  duration: 0.9,
  times: [0, 0.6, 1],
  ease: [0.4, 0, 0.2, 1],
};

export default function DevelopingDot({ arriving = false, className = "", style }: Props) {
  return (
    <motion.div
      className={`pointer-events-none ${className}`}
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 45% 40%, var(--accent) 0%, color-mix(in srgb, var(--accent) 50%, transparent) 50%, transparent 100%)",
        boxShadow: "0 0 7px 2px var(--accent-glow), 0 0 2px var(--accent)",
        filter: "blur(0.4px)",
        ...style,
      }}
      animate={arriving ? ARRIVE : BREATH}
      transition={arriving ? ARRIVE_TRANSITION : undefined}
    />
  );
}
