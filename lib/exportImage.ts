// ── Image export utilities — download / share PNG blobs ──────────────────

/** Convert hex color + opacity to rgba string, for mobile Safari SVG foreignObject compat.
 *  color-mix(in srgb, ...) is not supported inside foreignObject on iOS WebKit. */
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function isMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|Android/i.test(navigator.userAgent);
}

export function canShare(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Try native share sheet. Returns true if shared (or user cancelled gracefully). */
export async function shareBlob(blob: Blob, filename: string): Promise<boolean> {
  if (!canShare()) return false;
  const file = new File([blob], filename, { type: "image/png" });
  try {
    if (!navigator.canShare || navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return true;
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return true; // user cancelled
  }
  return false;
}
