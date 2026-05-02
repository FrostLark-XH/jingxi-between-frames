"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { toBlob } from "html-to-image";
import { MemoryFrame, formatFrameNumber } from "@/data/demoFrames";
import { ThemeId, themes } from "@/lib/themes";

export type CollectionExportHandle = {
  renderToBlob: () => Promise<Blob>;
};

type Props = {
  frames: MemoryFrame[];
  themeId: ThemeId;
};

const CARD_W = 750;
const PADDING = 40;
const GAP = 24;

const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

function splitContent(content: string, maxLen: number): string {
  if (content.length <= maxLen) return content;
  return content.substring(0, maxLen).replace(/\n[^\n]*$/, "") + "…";
}

function formatExportTime(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

const FrameCollectionImageExport = forwardRef<CollectionExportHandle, Props>(
  function FrameCollectionImageExport({ frames, themeId }, ref) {
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
    const borderSoft = `color-mix(in srgb, ${t.textPrimary} 8%, transparent)`;

    if (frames.length === 0) return null;

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
            paddingBottom: PADDING,
            backgroundColor: t.bgBase,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', sans-serif",
            color: t.textPrimary,
            position: "relative",
            overflow: "hidden",
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

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* ── Cover header ── */}
            <div style={{ marginBottom: 36 }}>
              <div
                style={{
                  fontSize: 16,
                  letterSpacing: "0.2em",
                  color: textMuted,
                  marginBottom: 6,
                }}
              >
                ◈ 镜隙之间
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  fontFamily: "var(--font-serif), 'Noto Serif SC', 'Songti SC', serif",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                时间胶片
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: textMutedLow,
                  letterSpacing: "0.1em",
                }}
              >
                导出 {formatExportTime()}  ·  共 {frames.length} 帧
              </div>
            </div>

            {/* Divider after cover */}
            <div
              style={{
                height: 1,
                backgroundColor: borderSoft,
                marginBottom: 32,
              }}
            />

            {/* ── Frame cards ── */}
            {frames.map((frame, i) => (
              <div
                key={frame.id}
                style={{
                  marginBottom: i < frames.length - 1 ? GAP : 0,
                  paddingBottom: i < frames.length - 1 ? GAP : 0,
                  borderBottom:
                    i < frames.length - 1 ? `1px solid ${borderSoft}` : "none",
                }}
              >
                {/* Frame number + time */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      fontFamily: "'SF Mono', 'Cascadia Code', 'Consolas', monospace",
                      color: textMutedLow,
                      letterSpacing: "0.1em",
                    }}
                  >
                    NO.{formatFrameNumber(frame.frameIndex)}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "'SF Mono', 'Cascadia Code', 'Consolas', monospace",
                      color: textMutedLow,
                    }}
                  >
                    {frame.date} · {frame.time}
                  </span>
                </div>

                {/* Summary with accent line */}
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 2,
                      flexShrink: 0,
                      backgroundColor: accentSoft,
                      borderRadius: 1,
                      opacity: 0.4,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 18,
                      lineHeight: 1.7,
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
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: textMuted,
                    fontFamily: "var(--font-serif), 'Noto Serif SC', 'Songti SC', serif",
                    letterSpacing: "0.03em",
                    marginBottom: 14,
                    whiteSpace: "pre-wrap",
                    borderLeft: `1px solid ${accentSoft}`,
                    paddingLeft: 12,
                    opacity: 0.5,
                  }}
                >
                  {splitContent(frame.content, 250)}
                </div>

                {/* Tags + tone */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                  {frame.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        border: `1px solid color-mix(in srgb, ${accentSoft} 25%, transparent)`,
                        borderRadius: 3,
                        color: textMuted,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {frame.tone && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "1px 8px",
                        border: `1px solid color-mix(in srgb, ${t.accent} 15%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${t.accent} 5%, transparent)`,
                        borderRadius: 3,
                        color: `color-mix(in srgb, ${t.accent} 50%, transparent)`,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {frame.tone}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* ── Footer ── */}
            <div
              style={{
                height: 1,
                backgroundColor: borderSoft,
                marginTop: 32,
                marginBottom: 16,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                letterSpacing: "0.15em",
                color: textMutedLow,
              }}
            >
              <span>由镜隙之间显影</span>
              <span>时间帧档案卡  ·  {formatExportTime()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default FrameCollectionImageExport;
