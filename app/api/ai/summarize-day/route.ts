// POST /api/ai/summarize-day
// Real AI → mock fallback. Returns daily mainline, keywords, review hint.

export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getDaySummaryResult } from "@/services/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const date = typeof body.date === "string" ? body.date : "";
    const frames = Array.isArray(body.frames) ? body.frames : [];

    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
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
