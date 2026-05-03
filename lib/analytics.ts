// ── Anonymous event analytics ──────────────────────────────────────────────
// Only sends event name + timestamp. No user content, summary, tags, or PII.
// Silently skipped when NEXT_PUBLIC_ANALYTICS_ENDPOINT is not configured.

type EventName =
  | "app_open"
  | "first_frame_created"
  | "frame_developed"
  | "film_opened"
  | "png_exported"
  | "backup_exported";

export function track(
  event: EventName,
  metadata?: Record<string, string>
): void {
  if (typeof window === "undefined") return;

  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (!endpoint) return;

  try {
    const payload = {
      event,
      ts: new Date().toISOString(),
      ...(metadata ?? {}),
    };
    navigator.sendBeacon(endpoint, JSON.stringify(payload));
  } catch {
    // silently skip — analytics must never break the app
  }
}
