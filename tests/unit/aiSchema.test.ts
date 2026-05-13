import { describe, it, expect } from "vitest";
import { validateFrameAiOutput, validateReflectionOutput } from "@/src/lib/validation/aiSchema";

describe("aiSchema", () => {
  // ── validateFrameAiOutput ───────────────────────────────────────────────

  describe("validateFrameAiOutput", () => {
    it("合法 AI 输出通过", () => {
      const input = {
        summary: "这是一个关于午后的短记。",
        tags: ["日常", "阳光"],
        tone: "平静",
      };
      const result = validateFrameAiOutput(input);
      expect(result).not.toBeNull();
      expect(result!.summary).toBe("这是一个关于午后的短记。");
      expect(result!.tags).toEqual(["日常", "阳光"]);
      expect(result!.tone).toBe("平静");
    });

    it("缺少 summary 返回 null", () => {
      const result = validateFrameAiOutput({ tags: ["test"] });
      expect(result).toBeNull();
    });

    it("tags 不是数组返回 null", () => {
      const result = validateFrameAiOutput({ summary: "ok", tags: "not-array" });
      expect(result).toBeNull();
    });

    it("tags 包含非字符串元素返回 null", () => {
      const result = validateFrameAiOutput({ summary: "ok", tags: ["good", 123] });
      expect(result).toBeNull();
    });

    it("tone 可选——缺省时合法", () => {
      const input = { summary: "一则摘要。", tags: ["日常"] };
      const result = validateFrameAiOutput(input);
      expect(result).not.toBeNull();
      expect(result!.tone).toBeUndefined();
    });

    it("tone 为非字符串时返回 null", () => {
      const result = validateFrameAiOutput({ summary: "ok", tags: ["a"], tone: 123 });
      expect(result).toBeNull();
    });

    it("null 输入返回 null", () => {
      expect(validateFrameAiOutput(null)).toBeNull();
    });

    it("非对象输入返回 null", () => {
      expect(validateFrameAiOutput("string")).toBeNull();
      expect(validateFrameAiOutput(42)).toBeNull();
    });
  });

  // ── validateReflectionOutput ────────────────────────────────────────────

  describe("validateReflectionOutput", () => {
    it("合法 reflect 输出通过", () => {
      const input = {
        title: "关于光的碎片",
        story: "镜面里有昨天的影子，弯曲而模糊。风把光线吹散，碎片落在水面上。",
        floatingWords: ["光", "影子", "水面"],
        motifs: ["时光", "反射"],
        mood: ["平静", "忧伤"],
        basedOnCount: 5,
      };
      const result = validateReflectionOutput(input);
      expect(result).not.toBeNull();
      expect(result!.story).toBe(input.story);
      expect(result!.floatingWords).toEqual(["光", "影子", "水面"]);
      expect(result!.motifs).toEqual(["时光", "反射"]);
      expect(result!.mood).toEqual(["平静", "忧伤"]);
      expect(result!.basedOnCount).toBe(5);
    });

    it("缺少 story 返回 null", () => {
      const result = validateReflectionOutput({ floatingWords: ["a"], motifs: ["b"], mood: ["c"], basedOnCount: 1 });
      expect(result).toBeNull();
    });

    it("floatingWords 不是数组返回 null", () => {
      const result = validateReflectionOutput({
        story: "good", floatingWords: "not-array", motifs: ["a"], mood: ["b"], basedOnCount: 1,
      });
      expect(result).toBeNull();
    });

    it("motifs 不是数组返回 null", () => {
      const result = validateReflectionOutput({
        story: "good", floatingWords: ["a"], motifs: 123, mood: ["b"], basedOnCount: 1,
      });
      expect(result).toBeNull();
    });

    it("mood 不是数组返回 null", () => {
      const result = validateReflectionOutput({
        story: "good", floatingWords: ["a"], motifs: ["b"], mood: {}, basedOnCount: 1,
      });
      expect(result).toBeNull();
    });

    it("basedOnCount 不是数字返回 null", () => {
      const result = validateReflectionOutput({
        story: "good", floatingWords: ["a"], motifs: ["b"], mood: ["c"], basedOnCount: "5",
      });
      expect(result).toBeNull();
    });

    it("title 可选——缺省时合法", () => {
      const input = { story: "一则故事。", floatingWords: ["a"], motifs: ["b"], mood: ["c"], basedOnCount: 3 };
      const result = validateReflectionOutput(input);
      expect(result).not.toBeNull();
      expect(result!.title).toBeUndefined();
    });
  });
});
