// ── Image export utilities — share or download PNG blobs ───────────────────

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

export async function shareOrDownload(
  blob: Blob,
  filename: string,
  isMobile: boolean
): Promise<void> {
  if (isMobile && typeof navigator !== "undefined" && !!navigator.share) {
    const file = new File([blob], filename, { type: "image/png" });
    try {
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }

  // Fallback: direct download (always on desktop, or share-unavailable/declined on mobile)
  downloadBlob(blob, filename);
}
