// POST /api/ai/reflect
// Real AI → mock fallback. Returns reflection letter body + floating words.

export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getReflectionResult } from "@/services/ai";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateReflectionOutput } from "@/src/lib/validation/aiSchema";

const MAX_FRAMES = 50;

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit("reflect");
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "镜子另一边暂时忙碌，请稍后再试。", retryAfter: rl.retryAfter },
        { status: 429 }
      );
    }

    const body = await req.json();

    const frames = Array.isArray(body.frames) ? body.frames : [];

    if (frames.length === 0) {
      return NextResponse.json({ error: "frames is required" }, { status: 400 });
    }

    if (frames.length > MAX_FRAMES) {
      return NextResponse.json(
        { error: `单次最多处理 ${MAX_FRAMES} 帧` },
        { status: 400 }
      );
    }

    const result = await getReflectionResult({ frames });
    const validated = validateReflectionOutput(result);

    if (!validated) {
      return NextResponse.json(
        { error: "invalid reflection output", fallback: true },
        { status: 500 }
      );
    }

    return NextResponse.json(validated);
  } catch {
    return NextResponse.json(
      { error: "reflect failed" },
      { status: 500 }
    );
  }
}
