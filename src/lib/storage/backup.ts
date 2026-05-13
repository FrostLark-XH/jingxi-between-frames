import type { MemoryFrame } from "@/src/domain/frame/types";

const STORAGE_KEY_BACKUP = "jingxi_frames_backup";

interface BackupPayload {
  ts: number;
  frames: MemoryFrame[];
}

export function createBackup(frames: MemoryFrame[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: BackupPayload = { ts: Date.now(), frames };
    localStorage.setItem(STORAGE_KEY_BACKUP, JSON.stringify(payload));
  } catch {
    // quota exceeded during backup — can't do much
  }
}

export function getLatestBackup(): MemoryFrame[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BACKUP);
    if (!raw) return null;
    const payload: BackupPayload = JSON.parse(raw);
    if (!Array.isArray(payload.frames)) return null;
    return payload.frames;
  } catch {
    return null;
  }
}

export function clearBackup(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_BACKUP);
  } catch {}
}
