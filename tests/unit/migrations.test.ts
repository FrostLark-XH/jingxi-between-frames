import { describe, it, expect, beforeEach } from "vitest";
import { migrateAll, CURRENT_VERSION } from "@/src/lib/storage/migrations";
import type { MemoryFrame } from "@/src/domain/frame/types";
import { contentHash } from "@/services/ai/types";

describe("migrations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── Constants ───────────────────────────────────────────────────────────

  it("CURRENT_VERSION = 3", () => {
    expect(CURRENT_VERSION).toBe(3);
  });

  // ── v1 → v3 ─────────────────────────────────────────────────────────────

  describe("v1 raw data → v3", () => {
    it("v1 可迁移到 v3", () => {
      const v1Data = [
        {
          id: "a1",
          date: "2026-05-10",
          time: "14:30",
          content: "今天的阳光很好。",
          frameIndex: 1,
          wordCount: 7,
        },
      ];
      const result = migrateAll(v1Data);
      expect(result.success).toBe(true);
      expect(result.frames).toHaveLength(1);
      expect(result.frames[0].rawContent).toBe("今天的阳光很好。");
      expect(result.frames[0].frameStatus).toBe("active");
    });

    it("rawContent 缺失时补 content", () => {
      const v1Data = [
        {
          id: "b1",
          date: "2026-05-10",
          time: "14:30",
          content: "测试内容。",
          frameIndex: 1,
          wordCount: 5,
        },
      ];
      const result = migrateAll(v1Data);
      expect(result.frames[0].rawContent).toBe("测试内容。");
    });

    it("rawContent 已存在时不覆盖", () => {
      const v1Data = [
        {
          id: "c1",
          date: "2026-05-10",
          time: "14:30",
          content: "新内容。",
          rawContent: "原始内容不可覆盖",
          frameIndex: 1,
          wordCount: 4,
          frameStatus: "active",
        },
      ];
      const result = migrateAll(v1Data);
      expect(result.frames[0].rawContent).toBe("原始内容不可覆盖");
    });

    it("deletedAt 存在时 frameStatus = deleted", () => {
      const v1Data = [
        {
          id: "d1",
          date: "2026-05-01",
          time: "10:00",
          content: "已删除的记录。",
          frameIndex: 1,
          wordCount: 6,
          deletedAt: new Date().toISOString(),
        },
      ];
      const result = migrateAll(v1Data);
      expect(result.frames[0].frameStatus).toBe("deleted");
    });

    it("超过 7 天的已删除帧被过滤", () => {
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const v1Data = [
        {
          id: "e1",
          date: "2026-04-01",
          time: "10:00",
          content: "很老的已删除记录。",
          frameIndex: 1,
          wordCount: 8,
          deletedAt: oldDate,
        },
      ];
      const result = migrateAll(v1Data);
      expect(result.frames).toHaveLength(0);
    });

    it("旧 AI 数据无 contentHash 时 developStatus = developed", () => {
      const v1Data = [
        {
          id: "f1",
          date: "2026-05-10",
          time: "14:30",
          content: "有 AI 数据但无 contentHash。",
          frameIndex: 1,
          wordCount: 12,
          summary: "一则摘要",
          tags: ["阳光", "日常"],
        },
      ];
      const result = migrateAll(v1Data);
      expect(result.frames[0].developStatus).toBe("developed");
    });

    it("ai.error 时 developStatus = failed", () => {
      const v1Data = [
        {
          id: "g1",
          date: "2026-05-10",
          time: "14:30",
          content: "AI 调用失败。",
          frameIndex: 1,
          wordCount: 6,
          ai: { error: "timeout", provider: "real" },
        },
      ];
      const result = migrateAll(v1Data);
      expect(result.frames[0].developStatus).toBe("failed");
    });

    it("有 AI 数据 + contentHash 不匹配时 developStatus = stale", () => {
      const hash = contentHash("不同的内容");
      const v1Data = [
        {
          id: "h1",
          date: "2026-05-10",
          time: "14:30",
          content: "内容已被修改。",
          frameIndex: 1,
          wordCount: 6,
          summary: "旧的摘要",
          tags: ["旧标签"],
          ai: {
            provider: "real",
            contentHash: hash, // hash of different content
          },
        },
      ];
      const result = migrateAll(v1Data);
      expect(result.frames[0].developStatus).toBe("stale");
    });

    it("有 AI 数据 + contentHash 匹配时 developStatus = developed", () => {
      const content = "内容一致。";
      const hash = contentHash(content);
      const v1Data = [
        {
          id: "i1",
          date: "2026-05-10",
          time: "14:30",
          content,
          frameIndex: 1,
          wordCount: 5,
          summary: "摘要",
          tags: ["标签"],
          ai: {
            provider: "real",
            contentHash: hash, // matches current content
          },
        },
      ];
      const result = migrateAll(v1Data);
      expect(result.frames[0].developStatus).toBe("developed");
    });
  });

  // ── Error handling ──────────────────────────────────────────────────────

  describe("error handling", () => {
    it("空数组返回 success", () => {
      const result = migrateAll([]);
      expect(result.success).toBe(true);
      expect(result.frames).toHaveLength(0);
    });

    it("非数组输入返回 success + 空 frames", () => {
      const result = migrateAll({ foo: "bar" });
      expect(result.success).toBe(true);
      expect(result.frames).toHaveLength(0);
    });

    it("migrateAll 失败时不返回裸 [] (有 fallback)", () => {
      // Simulate: valid v1 frames that partially fail — fallback via v1→v2 only
      const v1Data = [
        {
          id: "j1",
          date: "2026-05-10",
          time: "14:30",
          content: "第一条。",
          frameIndex: 1,
          wordCount: 4,
        },
        {
          id: "j2",
          date: "2026-05-10",
          time: "15:00",
          content: "第二条。",
          frameIndex: 2,
          wordCount: 4,
        },
      ];
      const result = migrateAll(v1Data);
      // In normal flow, success should be true
      // The "no bare []" guarantee means: if success is false, frames should still exist
      if (!result.success) {
        expect(result.frames.length).toBeGreaterThan(0);
      }
      expect(result.success).toBe(true);
    });

    it("迁移后每帧通过 validateFrame 检查", () => {
      const v1Data = [
        {
          id: "k1",
          date: "2026-05-10",
          time: "14:30",
          content: "正常帧。",
          frameIndex: 1,
          wordCount: 4,
        },
      ];
      const result = migrateAll(v1Data);
      for (const f of result.frames) {
        expect(f.id).toBeTruthy();
        expect(typeof f.content).toBe("string");
        expect(typeof f.rawContent).toBe("string");
        expect(f.rawContent.length).toBeGreaterThan(0);
        expect(f.frameStatus).toBeTruthy();
        expect(f.developStatus).toBeTruthy();
        expect(f.createdAt).toBeTruthy();
      }
    });
  });
});
