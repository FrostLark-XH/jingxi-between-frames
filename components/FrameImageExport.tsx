"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { toBlob } from "html-to-image";
import { MemoryFrame, formatFrameNumber } from "@/data/demoFrames";
import { ThemeId, themes } from "@/lib/themes";
import { hexToRgba, isMobileUA } from "@/lib/exportImage";

export type ImageExportHandle = {
  renderToBlob: () => Promise<Blob>;
};

type Props = {
  frame: MemoryFrame;
  themeId: ThemeId;
};

const CARD_W = 750;
const PADDING = 56;

const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

function splitContent(content: string, maxLen: number): string {
  if (content.length <= maxLen) return content;
  return content.substring(0, maxLen).replace(/\n[^\n]*$/, "") + "…";
}

/** Strip leading full-width spaces (indent) from export content. */
function stripIndent(text: string): string {
  return text.replace(/^[　]+/, "");
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
  const textMutedLow = hexToRgba(t.textPrimary, 0.25);
  const textSummary = hexToRgba(t.textPrimary, 0.65);
  const dividerColor = hexToRgba(t.textPrimary, 0.07);
  const tagBg = hexToRgba(t.accent, 0.05);
  const tagText = hexToRgba(t.textPrimary, 0.68);
  const toneColor = hexToRgba(t.accent, 0.5);

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
          {/* ── Layer A: Header — brand ── */}
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

          {/* ── Layer A: Header — frame number + date/time ── */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 14,
              marginBottom: 24,
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
                letterSpacing: "0.06em",
              }}
            >
              {frame.date} · {frame.time}
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              backgroundColor: dividerColor,
              marginBottom: 30,
            }}
          />

          {/* ── Layer B: Main content ── */}
          <div
            style={{
              fontSize: 20,
              lineHeight: 1.9,
              color: t.textPrimary,
              fontFamily: "'Noto Serif SC', 'Songti SC', serif",
              letterSpacing: "0.03em",
              marginBottom: 34,
              whiteSpace: "pre-wrap",
            }}
          >
            {stripIndent(splitContent(frame.content, 400))}
          </div>

          {/* ── Layer C: AI summary ── */}
          {frame.summary && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  color: textMutedLow,
                  marginBottom: 10,
                }}
              >
                显影摘要
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                <div
                  style={{
                    width: 2,
                    flexShrink: 0,
                    backgroundColor: accentSoft,
                    borderRadius: 1,
                    opacity: 0.25,
                  }}
                />
                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.75,
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

          {/* ── Layer D: Tags ── */}
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
                    fontSize: 11,
                    padding: "3px 14px",
                    backgroundColor: tagBg,
                    borderRadius: 4,
                    color: tagText,
                    letterSpacing: "0.03em",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* ── Layer D: Tone ── */}
          {frame.tone && (
            <div style={{ marginBottom: 28 }}>
              <span
                style={{
                  fontSize: 11,
                  color: toneColor,
                  letterSpacing: "0.06em",
                }}
              >
                {frame.tone}
              </span>
            </div>
          )}

          {/* ── Footer ── */}
          <div
            style={{
              height: 1,
              backgroundColor: dividerColor,
              marginBottom: 18,
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              fontSize: 11,
              letterSpacing: "0.15em",
              color: textMutedLow,
            }}
          >
            <span>时间帧档案卡</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FrameImageExport;
