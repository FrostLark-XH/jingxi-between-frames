// POST /api/ai/summarize-day
// Real AI → mock fallback. Returns daily mainline, keywords, review hint.

export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getDaySummaryResult } from "@/services/ai";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_FRAMES = 20;

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const rl = checkRateLimit("summarize-day");
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "暗房暂时忙碌，请稍后再试。", retryAfter: rl.retryAfter },
        { status: 429 }
      );
    }

    const body = await req.json();

    const date = typeof body.date === "string" ? body.date : "";
    const frames = Array.isArray(body.frames) ? body.frames : [];

    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    if (frames.length > MAX_FRAMES) {
      return NextResponse.json(
        { error: `单次最多总结 ${MAX_FRAMES} 帧` },
        { status: 400 }
      );
    }

    const result = await getDaySummaryResult({ date, frames });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "summarize-day failed" },
      { status: 500 }
    );
  }
}
