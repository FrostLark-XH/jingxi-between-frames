// POST /api/ai/develop-frame
// Real AI → mock fallback. Never exposes API key to client.

export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { contentHash } from "@/services/ai/types";
import { getDevelopFrameResult } from "@/services/ai/index";
import { checkRateLimit, checkContentLength } from "@/lib/rateLimit";
import { validateFrameAiOutput } from "@/src/lib/validation/aiSchema";

const MAX_CONTENT_LENGTH = 3000;

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const rl = checkRateLimit("develop-frame");
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "暗房暂时忙碌，请稍后再试。", retryAfter: rl.retryAfter },
        { status: 429 }
      );
    }

    const body = await req.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const createdAt =
      typeof body.createdAt === "string" ? body.createdAt : new Date().toISOString();

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    // Content length limit
    const lengthError = checkContentLength(content, MAX_CONTENT_LENGTH);
    if (lengthError) {
      return NextResponse.json({ error: lengthError }, { status: 400 });
    }

    const result = await getDevelopFrameResult(content, createdAt);
    const validated = validateFrameAiOutput(result);

    if (!validated) {
      return NextResponse.json(
        { error: "invalid AI output", fallback: true },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...validated,
      contentHash: contentHash(content),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[develop-frame] error:", msg);
    return NextResponse.json(
      { error: "develop-frame failed" },
      { status: 500 }
    );
  }
}
