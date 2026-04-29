// ── Text formatting utilities ──────────────────────────────────────────────
// Simple paragraph indentation for Chinese text input.

/**
 * Add 2 full-width space indent to each paragraph.
 * Preserves existing indentation, normalizes line endings,
 * collapses excessive blank lines.
 */
export function formatText(text: string): string {
  if (!text.trim()) return text;

  let result = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const raw = result.split("\n");
  const paragraphs: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const trimmed = raw[i].trimEnd();
    if (trimmed.length > 0) {
      paragraphs.push(trimmed);
    } else {
      const prev = i > 0 ? raw[i - 1].trimEnd() : "";
      const next = i < raw.length - 1 ? raw[i + 1].trimEnd() : "";
      if (prev.length > 0 && next.length > 0) paragraphs.push("");
    }
  }

  const indented = paragraphs.map((p) => {
    if (p.length === 0) return p;
    if (p.startsWith("　　") || p.startsWith("  ")) return p;
    return "　　" + p;
  });

  return indented.join("\n");
}
