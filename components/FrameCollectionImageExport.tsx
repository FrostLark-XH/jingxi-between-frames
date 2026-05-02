"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { toBlob } from "html-to-image";
import { MemoryFrame, formatFrameNumber } from "@/data/demoFrames";
import { ThemeId, themes } from "@/lib/themes";
import { hexToRgba, isMobileUA } from "@/lib/exportImage";

export type CollectionExportHandle = {
  renderToBlob: () => Promise<Blob>;
};

type Props = {
  frames: MemoryFrame[];
  themeId: ThemeId;
};

const CARD_W = 750;
const PADDING = 56;
const GAP = 28;

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
        await document.fonts?.ready;
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => requestAnimationFrame(r));
        const blob = await toBlob(containerRef.current, {
          pixelRatio: isMobileUA() ? 1.5 : 2,
          backgroundColor: t.bgBase,
          cacheBust: true,
        });
        if (!blob) throw new Error("Failed to generate image blob");
        return blob;
      },
    }));

    const accentSoft = t.accentSoft;
    const textMuted = hexToRgba(t.textPrimary, 0.45);
    const textMutedLow = hexToRgba(t.textPrimary, 0.25);
    const textSummary = hexToRgba(t.textPrimary, 0.55);
    const borderSoft = hexToRgba(t.textPrimary, 0.07);
    const tagBg = hexToRgba(t.accent, 0.08);
    const tagColor = hexToRgba(t.textPrimary, 0.6);

    if (frames.length === 0) return null;

    return (
      <div
        style={{
          width: 0,
          height: 0,
          overflow: "hidden",
          position: "absolute",
          left: 0,
          top: 0,
        }}
      >
        <div
          ref={containerRef}
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
              opacity: 0.022,
              backgroundImage: `url(${GRAIN_SVG})`,
              backgroundRepeat: "repeat",
              backgroundSize: "200px 200px",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* ── Cover header ── */}
            <div style={{ marginBottom: 40 }}>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: "0.2em",
                  color: textMutedLow,
                  marginBottom: 6,
                }}
              >
                镜隙之间
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  fontFamily: "'Noto Serif SC', 'Songti SC', serif",
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
                marginBottom: 36,
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
                    marginBottom: 18,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "'SF Mono', 'Cascadia Code', 'Consolas', monospace",
                      color: textMutedLow,
                      letterSpacing: "0.08em",
                    }}
                  >
                    NO.{formatFrameNumber(frame.frameIndex)}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "'SF Mono', 'Cascadia Code', 'Consolas', monospace",
                      color: textMutedLow,
                    }}
                  >
                    {frame.date} · {frame.time}
                  </span>
                </div>

                {/* ── Main: original content ── */}
                <div
                  style={{
                    fontSize: 18,
                    lineHeight: 1.95,
                    color: t.textPrimary,
                    fontFamily: "'Noto Serif SC', 'Songti SC', serif",
                    letterSpacing: "0.03em",
                    marginBottom: 22,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {splitContent(frame.content, 280)}
                </div>

                {/* ── AI summary ── */}
                {frame.summary && (
                  <div style={{ marginBottom: 18 }}>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        color: textMutedLow,
                        marginBottom: 8,
                      }}
                    >
                      显影摘要
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div
                        style={{
                          width: 2,
                          flexShrink: 0,
                          backgroundColor: accentSoft,
                          borderRadius: 1,
                          opacity: 0.3,
                        }}
                      />
                      <p
                        style={{
                          fontSize: 14,
                          lineHeight: 1.7,
                          fontFamily: "'Noto Serif SC', 'Songti SC', serif",
                          letterSpacing: "0.04em",
                          color: textSummary,
                          margin: 0,
                        }}
                      >
                        {frame.summary}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Tags ── */}
                {frame.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {frame.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          padding: "3px 10px",
                          backgroundColor: tagBg,
                          borderRadius: 4,
                          color: tagColor,
                          letterSpacing: "0.03em",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* ── Tone ── */}
                {frame.tone && (
                  <span
                    style={{
                      fontSize: 10,
                      color: hexToRgba(t.accent, 0.5),
                      letterSpacing: "0.05em",
                    }}
                  >
                    {frame.tone}
                  </span>
                )}
              </div>
            ))}

            {/* ── Footer ── */}
            <div
              style={{
                height: 1,
                backgroundColor: borderSoft,
                marginTop: 36,
                marginBottom: 18,
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
