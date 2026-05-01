// ── Real AI provider — OpenAI-compatible HTTP calls ─────────────────────
// SERVER-ONLY. Never import in client components — API key would leak.
// Used by API Routes; falls back to mockProvider on any failure.

import { FrameAiOutput, DaySummaryOutput, DaySummaryInput } from "./types";
import { buildDevelopFramePrompt, buildSummarizeDayPrompt } from "./prompts";

function getConfig() {
  const key = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  return { key, baseUrl, model };
}

async function callLlm(prompt: string): Promise<string> {
  const { key, baseUrl, model } = getConfig();
  if (!key) throw new Error("LLM_API_KEY not configured");

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: key,
      "User-Agent": "DMXAPI/1.0.0 (https://ssvip.dmxapi.com)",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "你始终以 JSON 格式回复，不要包含 markdown 代码块或其他文字。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    throw new Error("LLM returned empty or invalid response");
  }
  return raw.trim();
}

function parseJson<T>(raw: string, label: string): T {
  // Strip markdown code fences if present
  let cleaned = raw;
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Failed to parse ${label} JSON from: ${raw.slice(0, 150)}`);
  }
}

export async function developFrameReal(
  content: string,
  createdAt: string
): Promise<FrameAiOutput> {
  const { model } = getConfig();
  const prompt = buildDevelopFramePrompt(content, createdAt);
  const raw = await callLlm(prompt);
  const parsed = parseJson<{
    summary: string;
    tags: string[];
    keywords?: string[];
    tone?: string;
  }>(raw, "develop-frame");

  return {
    summary: parsed.summary || content.substring(0, 48),
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 4) : [],
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
    tone: parsed.tone || "平静",
    provider: "real",
    model,
  };
}

export async function summarizeDayReal(
  input: DaySummaryInput
): Promise<DaySummaryOutput> {
  const { model } = getConfig();
  const prompt = buildSummarizeDayPrompt(input.date, input.frames);
  const raw = await callLlm(prompt);
  const parsed = parseJson<{
    mainline: string;
    keywords: string[];
    reviewHint: string;
  }>(raw, "summarize-day");

  return {
    mainline: parsed.mainline || "今天的记录比较分散。",
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
    reviewHint: parsed.reviewHint || "可以回看今天的原始记录。",
    provider: "real",
    model,
  };
}
