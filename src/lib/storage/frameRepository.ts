import type { MemoryFrame } from "@/src/domain/frame/types";

export type SaveResult =
  | { success: true; sizeWarning?: "approaching" | "critical" }
  | { success: false; error: string };

export interface FrameRepository {
  loadAll(): MemoryFrame[];
  saveAll(frames: MemoryFrame[]): SaveResult;
}
