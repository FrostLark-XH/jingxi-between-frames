import type { MemoryFrame } from "@/src/domain/frame/types";
import { STORAGE_KEY_FRAMES } from "@/src/lib/storage/storageKeys";
import { migrateAll } from "@/src/lib/storage/migrations";
import { getLatestBackup } from "@/src/lib/storage/backup";
import type { FrameRepository, SaveResult } from "@/src/lib/storage/frameRepository";

const SIZE_APPROACHING = 2.5 * 1024 * 1024; // 2.5MB — warn
const SIZE_CRITICAL = 3.5 * 1024 * 1024;    // 3.5MB — strong warning

function estimateSize(frames: MemoryFrame[]): number {
  try {
    return new Blob([JSON.stringify(frames)]).size;
  } catch {
    return 0;
  }
}

export function createLocalStorageFrameRepository(): FrameRepository {
  return {
    loadAll(): MemoryFrame[] {
      if (typeof window === "undefined") return [];
      try {
        const raw = localStorage.getItem(STORAGE_KEY_FRAMES);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        const result = migrateAll(parsed);

        // Write back only when migration actually transformed data.
        // On failure (result.success === false), preserve original localStorage data.
        if (result.success && result.migrated) {
          localStorage.setItem(STORAGE_KEY_FRAMES, JSON.stringify(result.frames));
        } else if (!result.success) {
          console.error("[loadAll] migration failed, original data preserved:", result.error);
        }

        return result.frames;
      } catch {
        return [];
      }
    },

    saveAll(frames: MemoryFrame[]): SaveResult {
      if (typeof window === "undefined") return { success: true };

      try {
        const json = JSON.stringify(frames);
        localStorage.setItem(STORAGE_KEY_FRAMES, json);

        const size = estimateSize(frames);
        if (size > SIZE_CRITICAL) {
          return { success: true, sizeWarning: "critical" };
        }
        if (size > SIZE_APPROACHING) {
          return { success: true, sizeWarning: "approaching" };
        }
        return { success: true };
      } catch (err) {
        // QuotaExceededError — try to recover from backup
        if (err instanceof DOMException && err.name === "QuotaExceededError") {
          try {
            const backup = getLatestBackup();
            if (backup) {
              localStorage.setItem(STORAGE_KEY_FRAMES, JSON.stringify(backup));
            }
          } catch {}
          return { success: false, error: "存储空间不足，请导出数据后清理" };
        }
        return { success: false, error: "保存失败" };
      }
    },
  };
}
