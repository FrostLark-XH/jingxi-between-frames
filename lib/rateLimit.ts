// ── Simple sliding-window rate limiter ─────────────────────────────────────
// In-memory, per-isolate. Adequate for low-traffic beta; not suitable for
// multi-instance production without a shared store.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const counters = new Map<string, number[]>();

function prune(key: string, now: number) {
  const timestamps = counters.get(key);
  if (!timestamps) return;
  const cutoff = now - WINDOW_MS;
  let i = 0;
  while (i < timestamps.length && timestamps[i] < cutoff) i++;
  if (i > 0) {
    const trimmed = timestamps.slice(i);
    if (trimmed.length === 0) counters.delete(key);
    else counters.set(key, trimmed);
  }
}

export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  prune(key, now);

  const timestamps = counters.get(key) ?? [];
  if (timestamps.length >= MAX_REQUESTS) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  }

  counters.set(key, [...timestamps, now]);
  return { allowed: true };
}

export function checkContentLength(
  content: string,
  maxLen: number
): string | null {
  if (content.length > maxLen) {
    return `内容超过 ${maxLen} 字限制`;
  }
  return null;
}
