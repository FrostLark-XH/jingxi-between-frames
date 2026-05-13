import { describe, it, expect } from "vitest";
import { createFrame } from "@/src/domain/frame/createFrame";

describe("createFrame", () => {
  const input = { content: "今天在暗房里待了很久。", frameIndex: 1 };

  it("content 原样保存", () => {
    const f = createFrame(input);
    expect(f.content).toBe("今天在暗房里待了很久。");
  });

  it("rawContent 等于原始输入", () => {
    const f = createFrame(input);
    expect(f.rawContent).toBe("今天在暗房里待了很久。");
  });

  it("不插入首行缩进（content 中无全角空格）", () => {
    const f = createFrame(input);
    expect(f.content).not.toContain("　　");
  });

  it("默认 frameStatus = active", () => {
    const f = createFrame(input);
    expect(f.frameStatus).toBe("active");
  });

  it("默认 developStatus = idle", () => {
    const f = createFrame(input);
    expect(f.developStatus).toBe("idle");
  });

  it("默认 status = saved（向后兼容）", () => {
    const f = createFrame(input);
    expect(f.status).toBe("saved");
  });

  it("默认 type = text", () => {
    const f = createFrame(input);
    expect(f.type).toBe("text");
  });

  it("voice 类型可传入", () => {
    const f = createFrame({ ...input, type: "voice", duration: "00:42" });
    expect(f.type).toBe("voice");
    expect(f.duration).toBe("00:42");
  });
});
