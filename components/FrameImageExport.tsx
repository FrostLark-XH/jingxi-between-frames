"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { toBlob } from "html-to-image";
import { MemoryFrame, formatFrameNumber } from "@/data/demoFrames";
import { ThemeId, themes } from "@/lib/themes";

export type ImageExportHandle = {
  renderToBlob: () => Promise<Blob>;
};

type Props = {
  frame: MemoryFrame;
  themeId: ThemeId;
};

const CARD_W = 750;
const PADDING = 40;

const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

function splitContent(content: string, maxLen: number): string {
  if (content.length <= maxLen) return content;
  return content.substring(0, maxLen).replace(/\n[^\n]*$/, "") + "…";
}

const FrameImageExport = forwardRef<ImageExportHandle, Props>(function FrameImageExport(
  { frame, themeId },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = themes[themeId];

  useImperativeHandle(ref, () => ({
    async renderToBlob() {
      if (!containerRef.current) throw new Error("Export container not mounted");
      const blob = await toBlob(containerRef.current, {
        pixelRatio: 2,
        backgroundColor: t.bgBase,
        cacheBust: true,
      });
      if (!blob) throw new Error("Failed to generate image blob");
      return blob;
    },
  }));

  const accentSoft = t.accentSoft;
  const textMuted = `color-mix(in srgb, ${t.textPrimary} 45%, transparent)`;
  const textMutedLow = `color-mix(in srgb, ${t.textPrimary} 25%, transparent)`;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        visibility: "hidden",
        left: -9999,
        top: 0,
      }}
    >
      <div
        style={{
          width: CARD_W,
          padding: PADDING,
          backgroundColor: t.bgBase,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', sans-serif",
          color: t.textPrimary,
          position: "relative",
          overflow: "hidden",
          borderRadius: 8,
        }}
      >
        {/* Paper grain */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.025,
            backgroundImage: `url(${GRAIN_SVG})`,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
          }}
        />

        {/* Content wrapper (above grain) */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Brand header */}
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.2em",
              color: textMutedLow,
              marginBottom: 28,
            }}
          >
            ◈ 镜隙之间
          </div>

          {/* Frame number + time */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 600,
                fontFamily: "'SF Mono', 'Cascadia Code', 'Consolas', monospace",
                letterSpacing: "0.1em",
                color: textMuted,
              }}
            >
              NO.{formatFrameNumber(frame.frameIndex)}
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              fontFamily: "'SF Mono', 'Cascadia Code', 'Consolas', monospace",
              letterSpacing: "0.12em",
              color: textMutedLow,
              marginBottom: 28,
            }}
          >
            {frame.date} &middot; {frame.time}
          </div>

          {/* Accent line + summary */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div
              style={{
                width: 2,
                flexShrink: 0,
                backgroundColor: accentSoft,
                borderRadius: 1,
                opacity: 0.45,
              }}
            />
            <p
              style={{
                fontSize: 22,
                lineHeight: 1.8,
                fontFamily: "var(--font-serif), 'Noto Serif SC', 'Songti SC', serif",
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              {frame.summary || "请静候时光沉淀…"}
            </p>
          </div>

          {/* Original content */}
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.75,
              color: textMuted,
              fontFamily: "var(--font-serif), 'Noto Serif SC', 'Songti SC', serif",
              letterSpacing: "0.03em",
              marginBottom: 24,
              whiteSpace: "pre-wrap",
              borderLeft: `1px solid ${accentSoft}`,
              paddingLeft: 14,
              opacity: 0.55,
            }}
          >
            {splitContent(frame.content, 300)}
          </div>

          {/* Tags */}
          {frame.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {frame.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 12,
                    padding: "3px 10px",
                    border: `1px solid color-mix(in srgb, ${accentSoft} 30%, transparent)`,
                    borderRadius: 3,
                    color: textMuted,
                    letterSpacing: "0.04em",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Tone badge */}
          {frame.tone && (
            <div style={{ marginBottom: 32 }}>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 10px",
                  border: `1px solid color-mix(in srgb, ${t.accent} 18%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${t.accent} 6%, transparent)`,
                  borderRadius: 3,
                  color: `color-mix(in srgb, ${t.accent} 55%, transparent)`,
                  letterSpacing: "0.06em",
                }}
              >
                {frame.tone}
              </span>
            </div>
          )}

          {/* Footer divider */}
          <div
            style={{
              height: 1,
              backgroundColor: `color-mix(in srgb, ${t.textPrimary} 6%, transparent)`,
              marginBottom: 16,
            }}
          />

          {/* Footer signature */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              letterSpacing: "0.15em",
              color: textMutedLow,
            }}
          >
            <span>镜隙之间</span>
            <span>时间帧档案卡</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FrameImageExport;
