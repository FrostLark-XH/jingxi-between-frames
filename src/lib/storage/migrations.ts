import type { MemoryFrame, DevelopStatus, DevelopedData } from "@/src/domain/frame/types";
import { contentHash } from "@/services/ai/types";

export const CURRENT_VERSION = 3;

const PRE_MIGRATION_KEY = "jingxi_frames_pre_migration";

// ── Migration result type ───────────────────────────────────────────────────

export type MigrationResult = {
  success: boolean;
  frames: MemoryFrame[];
  /** Human-readable error description for toast/console */
  error?: string;
  /** True if any frame was transformed — caller should write back */
  migrated: boolean;
};

// ── v1 helpers ──────────────────────────────────────────────────────────────

function buildDeveloped(frame: Record<string, unknown>): DevelopedData | undefined {
  const summary = typeof frame.summary === "string" && frame.summary.length > 0 ? frame.summary : "";
  const tags = Array.isArray(frame.tags) ? frame.tags.filter((t): t is string => typeof t === "string") : [];
  const tone = typeof frame.tone === "string" ? frame.tone : undefined;
  const ai = (frame.ai && typeof frame.ai === "object") ? frame.ai as DevelopedData["metadata"] : undefined;

  if (!summary && tags.length === 0 && !ai) return undefined;

  return {
    summary,
    tags,
    ...(tone ? { tone } : {}),
    ...(ai ? { metadata: ai } : {}),
  };
}

// ── Idempotency: detect already-migrated v3 frames ──────────────────────────

function isAlreadyMigrated(raw: Record<string, unknown>): boolean {
  return typeof raw.rawContent === "string" && typeof raw.frameStatus === "string";
}

// ── v1 → v2: normalize old flat structure → typed MemoryFrame ───────────────

function migrateFrameV1ToV2(raw: Record<string, unknown>): MemoryFrame | null {
  // Idempotency guard: v3 frames pass through without reconstruction
  if (isAlreadyMigrated(raw)) {
    if (typeof raw.id !== "string" || typeof raw.content !== "string") return null;
    return raw as unknown as MemoryFrame;
  }

  if (typeof raw.id !== "string" || typeof raw.date !== "string") return null;

  const content = typeof raw.content === "string" ? raw.content
    : typeof raw.preview === "string" ? raw.preview
    : "";

  const preview = content.length > 100 ? content.substring(0, 100) + "…" : content;

  const oldStatus = String(raw.status ?? "");
  const status: MemoryFrame["status"] =
    oldStatus === "已显影" || oldStatus === "developing" ? "developing"
    : oldStatus === "整理中" || oldStatus === "organizing" ? "organizing"
    : "saved";

  const fallbackTime = new Date().toISOString();

  const deletedAt = typeof raw.deletedAt === "string" ? raw.deletedAt : undefined;

  // developStatus for v2: best-effort from old status — v3 will fix it
  const developStatus: MemoryFrame["developStatus"] =
    status === "developing" ? "developed"
    : status === "organizing" ? "developing"
    : "idle";

  const migrated: MemoryFrame = {
    id: raw.id as string,
    content,
    rawContent: content,
    preview,
    summary: typeof raw.summary === "string" ? raw.summary : "",
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string") : [],
    keywords: Array.isArray(raw.keywords) ? raw.keywords.filter((k): k is string => typeof k === "string") : undefined,
    tone: typeof raw.tone === "string" ? raw.tone : undefined,
    ai: (raw.ai && typeof raw.ai === "object") ? raw.ai as MemoryFrame["ai"] : undefined,
    date: raw.date as string,
    time: typeof raw.time === "string" ? raw.time : "",
    frameIndex: typeof raw.frameIndex === "number" ? raw.frameIndex : 1,
    wordCount: typeof raw.wordCount === "number" ? raw.wordCount : content.length,
    type: raw.type === "voice" ? "voice" : "text",
    duration: typeof raw.duration === "string" ? raw.duration : undefined,
    status,
    frameStatus: deletedAt ? "deleted" : "active",
    developStatus,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : fallbackTime,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : fallbackTime,
    deletedAt,
  };

  migrated.developed = buildDeveloped(migrated as unknown as Record<string, unknown>);

  return migrated;
}

// ── DevelopStatus inference from AI state, not old workflow status ──────────

function inferDevelopStatus(frame: MemoryFrame): DevelopStatus {
  // AI error takes priority
  if (frame.ai?.error) return "failed";

  const hasAiData = !!(
    frame.developed ||
    frame.ai ||
    (frame.summary && frame.summary.length > 0) ||
    frame.tags.length > 0
  );

  if (hasAiData) {
    // Only mark stale if contentHash exists and doesn't match.
    // Legacy data without contentHash is treated as developed (not stale).
    if (frame.ai?.contentHash && frame.ai.contentHash !== contentHash(frame.content)) {
      return "stale";
    }
    return "developed";
  }

  // No AI data — was it in-flight?
  if (frame.status === "organizing" || frame.status === "developing") {
    return "developing";
  }

  return "idle";
}

// ── v2 → v3: fix developStatus inference, protect rawContent, validate ──────

function migrateFrameV2ToV3(frame: MemoryFrame): MemoryFrame {
  let changed = false;

  // 1. rawContent: only set when missing — never overwrite existing
  if (!frame.rawContent) {
    frame.rawContent = frame.content;
    changed = true;
  }

  // 2. frameStatus: ensure consistent with deletedAt
  if (frame.deletedAt && frame.frameStatus !== "deleted") {
    frame.frameStatus = "deleted";
    changed = true;
  } else if (!frame.deletedAt && !frame.frameStatus) {
    frame.frameStatus = "active";
    changed = true;
  }

  // 3. developStatus: re-infer from actual AI data (fixes v2's status-based inference)
  const newStatus = inferDevelopStatus(frame);
  if (frame.developStatus !== newStatus) {
    frame.developStatus = newStatus;
    changed = true;
  }

  // 4. Patch missing contentHash for legacy AI data.
  //    Frames with AI results but no contentHash get the current hash,
  //    so future edits can correctly mark the frame as stale.
  if (frame.ai && !frame.ai.contentHash && newStatus === "developed") {
    frame.ai = { ...frame.ai, contentHash: contentHash(frame.content) };
    changed = true;
  }

  return changed ? { ...frame } : frame;
}

// ── Post-migration validation ───────────────────────────────────────────────

function validateFrame(f: MemoryFrame): string | null {
  if (typeof f.id !== "string" || !f.id) return "missing id";
  if (typeof f.content !== "string") return "missing content";
  if (typeof f.rawContent !== "string" || !f.rawContent) return "missing rawContent";
  if (!f.frameStatus) return "missing frameStatus";
  if (!f.developStatus) return "missing developStatus";
  if (typeof f.createdAt !== "string" || !f.createdAt) return "missing createdAt";
  return null;
}

// ── Orchestration: backup → v1→v2→v3 chain → validate → MigrationResult ────

export function migrateAll(raw: unknown): MigrationResult {
  if (!Array.isArray(raw)) return { success: true, frames: [], migrated: false };
  if (raw.length === 0) return { success: true, frames: [], migrated: false };

  // Pre-migration backup: raw data stored as-is before any transformation
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PRE_MIGRATION_KEY, JSON.stringify(raw));
    } catch {
      return {
        success: false,
        frames: [],
        error: "无法备份数据，迁移已中止",
        migrated: false,
      };
    }
  }

  try {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    const result = raw
      .map((f) => migrateFrameV1ToV2(f as Record<string, unknown>))
      .filter((f): f is MemoryFrame => f !== null)
      .map((f) => migrateFrameV2ToV3(f))
      .filter((f) => {
        if (!f.deletedAt) return true;
        return now - new Date(f.deletedAt).getTime() < sevenDays;
      });

    // Validate — patch missing fields instead of dropping frames
    for (let i = 0; i < result.length; i++) {
      const err = validateFrame(result[i]);
      if (err) {
        console.warn(`[migration] frame[${i}] (${result[i].id}): ${err} — auto-patching`);
        if (!result[i].rawContent) result[i].rawContent = result[i].content || "";
        if (!result[i].frameStatus) result[i].frameStatus = result[i].deletedAt ? "deleted" : "active";
        if (!result[i].developStatus) result[i].developStatus = "idle";
        if (!result[i].createdAt) result[i].createdAt = new Date().toISOString();
      }
    }

    // Determine if any transformation happened (for write-back decision)
    const rawJson = JSON.stringify(raw);
    const resultJson = JSON.stringify(result);
    const migrated = rawJson !== resultJson;

    // Clean up pre-migration backup on success
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(PRE_MIGRATION_KEY); } catch {}
    }

    return { success: true, frames: result, migrated };
  } catch (err) {
    const message = `迁移失败: ${String(err)}`;
    console.error("[migration]", message);

    // Best-effort fallback: v1→v2 only, so UI doesn't show empty
    const fallback = raw
      .map((f) => migrateFrameV1ToV2(f as Record<string, unknown>))
      .filter((f): f is MemoryFrame => f !== null);

    return {
      success: false,
      frames: fallback,
      error: message,
      migrated: false,
    };
  }
}
