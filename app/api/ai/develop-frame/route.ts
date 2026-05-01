// POST /api/ai/develop-frame
// Real AI → mock fallback. Never exposes API key to client.

import { NextRequest, NextResponse } from "next/server";
import { getDevelopFrameResult } from "@/services/ai";
import { contentHash } from "@/services/ai/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const createdAt =
      typeof body.createdAt === "string" ? body.createdAt : new Date().toISOString();

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const result = await getDevelopFrameResult(content, createdAt);

    return NextResponse.json({
      ...result,
      contentHash: contentHash(content),
    });
  } catch {
    return NextResponse.json(
      { error: "develop-frame failed" },
      { status: 500 }
    );
  }
}
