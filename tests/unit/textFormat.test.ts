import { describe, it, expect } from "vitest";
import { formatDisplayText, formatExportText } from "@/src/domain/frame/textFormat";

describe("textFormat", () => {
  // ── formatDisplayText ───────────────────────────────────────────────────

  describe("formatDisplayText", () => {
    it("不修改原始 content", () => {
      const original = "这是测试。\n这是第二行。";
      const _display = formatDisplayText(original);
      expect(original).toBe("这是测试。\n这是第二行。");
    });

    it("纯函数——多次调用返回相同结果", () => {
      const text = "今天下雨了。";
      expect(formatDisplayText(text)).toBe(formatDisplayText(text));
    });
  });

  // ── formatExportText ────────────────────────────────────────────────────

  describe("formatExportText", () => {
    it("返回派生文本，不修改原始 content", () => {
      const original = "这是测试。\n\n这是第二段。";
      const exported = formatExportText(original);
      expect(exported).not.toBe(original);
      expect(original).toBe("这是测试。\n\n这是第二段。");
    });

    it("默认不添加首行缩进", () => {
      const text = "这是一段文字。";
      const result = formatExportText(text);
      expect(result).not.toContain("　　");
    });

    it("清理多余空行——压缩连续空行为单空行", () => {
      const text = "第一段\n\n\n\n第二段";
      const result = formatExportText(text, { trimExtraBlankLines: true });
      // After processing, should not have triple consecutive newlines
      expect(result).not.toMatch(/\n\n\n/);
      // Paragraphs should be separated by exactly one blank line (double newline)
      expect(result).toContain("第一段\n\n第二段");
    });

    it("comfortable 段间距——段落间保留空行分隔", () => {
      // Input has two paragraphs separated by \n\n
      // formatExportText preserves this with comfortable spacing
      const text = "第一段\n\n第二段";
      const result = formatExportText(text, { trimExtraBlankLines: true, paragraphSpacing: "comfortable" });
      // Output preserves at least two newlines between the paragraphs
      expect(result).toMatch(/第一段\n{2,}第二段/);
    });

    it("保留单行正文原样（不注入缩进）", () => {
      const text = "这是一个完整的句子。";
      const result = formatExportText(text);
      expect(result).toBe("这是一个完整的句子。");
    });
  });
});
