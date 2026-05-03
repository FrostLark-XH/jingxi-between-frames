"use client";

import { useReducer, useCallback, useMemo } from "react";
import {
  MemoryFrame,
  TimeScale,
  getAggregatedYearData,
  getAggregatedMonthData,
  getAggregatedDayData,
  getTodayDateString,
} from "@/data/demoFrames";

const STORAGE_KEY = "jingxi_frames";

function migrateFrame(raw: Record<string, unknown>): MemoryFrame | null {
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

  return {
    id: raw.id as string,
    content,
    preview,
    summary: typeof raw.summary === "string" ? raw.summary : "",
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string") : [],
    keywords: Array.isArray(raw.keywords) ? raw.keywords.filter((k): k is string => typeof k === "string") : undefined,
    tone: typeof raw.tone === "string" ? raw.tone : undefined,
    date: raw.date as string,
    time: typeof raw.time === "string" ? raw.time : "",
    frameIndex: typeof raw.frameIndex === "number" ? raw.frameIndex : 1,
    wordCount: typeof raw.wordCount === "number" ? raw.wordCount : content.length,
    type: raw.type === "voice" ? "voice" : "text",
    duration: typeof raw.duration === "string" ? raw.duration : undefined,
    status,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : fallbackTime,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : fallbackTime,
    ai: raw.ai as MemoryFrame["ai"] | undefined,
  };
}

function loadFrames(): MemoryFrame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const migrated = parsed
      .map(migrateFrame)
      .filter((f): f is MemoryFrame => f !== null)
      // Purge frames deleted more than 7 days ago
      .filter((f) => {
        if (!f.deletedAt) return true;
        return now - new Date(f.deletedAt).getTime() < sevenDays;
      });
    // Write back purged data (even if empty, to clear fully expired trash)
    if (migrated.length !== parsed.length || migrated.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return [];
  }
}

function saveFrames(frames: MemoryFrame[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(frames));
  } catch {
    // quota exceeded or private browsing — silently skip
  }
}

type AppState = {
  frames: MemoryFrame[];
  timeScale: TimeScale;
  selectedYear: string;
  selectedMonth: string;
  selectedDate: string;
  selectedFrame: MemoryFrame | null;
  toast: string | null;
};

type Action =
  | { type: "SET_TIME_SCALE"; scale: TimeScale }
  | { type: "SET_YEAR"; year: string }
  | { type: "SET_MONTH"; month: string }
  | { type: "SET_DATE"; date: string }
  | { type: "ADD_FRAME"; frame: MemoryFrame }
  | { type: "UPDATE_FRAME"; id: string; changes: Partial<Pick<MemoryFrame, "content" | "tags" | "summary" | "tone" | "ai">> }
  | { type: "DELETE_FRAME"; id: string }
  | { type: "RESTORE_FRAME"; id: string }
  | { type: "PERMANENTLY_DELETE_FRAME"; id: string }
  | { type: "IMPORT_FRAMES"; frames: MemoryFrame[] }
  | { type: "CLEAR_ALL_FRAMES" }
  | { type: "SELECT_FRAME"; frame: MemoryFrame | null }
  | { type: "SHOW_TOAST"; message: string }
  | { type: "HIDE_TOAST" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_TIME_SCALE":
      return { ...state, timeScale: action.scale };
    case "SET_YEAR":
      return { ...state, selectedYear: action.year };
    case "SET_MONTH":
      return { ...state, selectedMonth: action.month };
    case "SET_DATE":
      return { ...state, selectedDate: action.date };
    case "ADD_FRAME": {
      const nextFrames = [action.frame, ...state.frames];
      saveFrames(nextFrames);
      return {
        ...state,
        frames: nextFrames,
        selectedDate: action.frame.date,
        selectedMonth: action.frame.date.substring(0, 7).replace(".", ""),
        selectedYear: action.frame.date.split(".")[0],
      };
    }
    case "UPDATE_FRAME": {
      const nextFrames = state.frames.map((f) =>
        f.id === action.id
          ? { ...f, ...action.changes, updatedAt: new Date().toISOString() }
          : f
      );
      saveFrames(nextFrames);
      return {
        ...state,
        frames: nextFrames,
        selectedFrame:
          state.selectedFrame?.id === action.id
            ? { ...state.selectedFrame, ...action.changes, updatedAt: new Date().toISOString() }
            : state.selectedFrame,
      };
    }
    case "DELETE_FRAME": {
      const nextFrames = state.frames.map((f) =>
        f.id === action.id ? { ...f, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : f
      );
      saveFrames(nextFrames);
      return {
        ...state,
        frames: nextFrames,
        selectedFrame: state.selectedFrame?.id === action.id ? null : state.selectedFrame,
      };
    }
    case "RESTORE_FRAME": {
      const nextFrames = state.frames.map((f) =>
        f.id === action.id ? { ...f, deletedAt: undefined, updatedAt: new Date().toISOString() } : f
      );
      saveFrames(nextFrames);
      return { ...state, frames: nextFrames };
    }
    case "PERMANENTLY_DELETE_FRAME": {
      const nextFrames = state.frames.filter((f) => f.id !== action.id);
      saveFrames(nextFrames);
      return { ...state, frames: nextFrames };
    }
    case "IMPORT_FRAMES": {
      // Validate, migrate, and deduplicate by id
      const incoming = action.frames
        .map((f) => migrateFrame(f as Record<string, unknown>))
        .filter((f): f is MemoryFrame => f !== null);
      const idMap = new Map<string, MemoryFrame>();
      for (const f of incoming) idMap.set(f.id, f);
      const nextFrames = [
        ...idMap.values(),
        ...state.frames.filter((f) => !idMap.has(f.id)),
      ];
      saveFrames(nextFrames);
      return { ...state, frames: nextFrames };
    }
    case "CLEAR_ALL_FRAMES": {
      saveFrames([]);
      return { ...state, frames: [] };
    }
    case "SELECT_FRAME":
      return { ...state, selectedFrame: action.frame };
    case "SHOW_TOAST":
      return { ...state, toast: action.message };
    case "HIDE_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}

export default function useAppState() {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const today = getTodayDateString();
    const [y, m] = today.split(".");
    return {
      frames: loadFrames(),
      timeScale: "day" as TimeScale,
      selectedYear: y,
      selectedMonth: m,
      selectedDate: today,
      selectedFrame: null as MemoryFrame | null,
      toast: null as string | null,
    };
  });

  const setTimeScale = useCallback(
    (scale: TimeScale) => dispatch({ type: "SET_TIME_SCALE", scale }),
    []
  );

  const addFrame = useCallback(
    (frame: MemoryFrame) => dispatch({ type: "ADD_FRAME", frame }),
    []
  );

  const updateFrame = useCallback(
    (id: string, changes: Partial<Pick<MemoryFrame, "content" | "tags" | "summary" | "tone" | "ai">>) =>
      dispatch({ type: "UPDATE_FRAME", id, changes }),
    []
  );

  const deleteFrame = useCallback(
    (id: string) => dispatch({ type: "DELETE_FRAME", id }),
    []
  );

  const restoreFrame = useCallback(
    (id: string) => dispatch({ type: "RESTORE_FRAME", id }),
    []
  );

  const permanentlyDeleteFrame = useCallback(
    (id: string) => dispatch({ type: "PERMANENTLY_DELETE_FRAME", id }),
    []
  );

  const importFrames = useCallback(
    (frames: MemoryFrame[]) => dispatch({ type: "IMPORT_FRAMES", frames }),
    []
  );

  const clearAllFrames = useCallback(
    () => dispatch({ type: "CLEAR_ALL_FRAMES" }),
    []
  );

  const selectFrame = useCallback(
    (frame: MemoryFrame | null) => dispatch({ type: "SELECT_FRAME", frame }),
    []
  );

  const showToast = useCallback(
    (message: string) => {
      dispatch({ type: "SHOW_TOAST", message });
      setTimeout(() => dispatch({ type: "HIDE_TOAST" }), 2500);
    },
    []
  );

  const aggregatedData = useMemo(() => {
    const { frames, timeScale } = state;
    const active = frames.filter((f) => !f.deletedAt);

    switch (timeScale) {
      case "year":
        return { type: "year" as const, data: getAggregatedYearData(active) };
      case "month":
        return { type: "month" as const, data: getAggregatedMonthData(active) };
      case "day":
        return { type: "day" as const, data: getAggregatedDayData(active) };
    }
  }, [state.frames, state.timeScale]);

  const todayDate = getTodayDateString();
  const todayFrameCount = state.frames.filter((f) => f.date === todayDate && !f.deletedAt).length;
  const nextFrameIndex = todayFrameCount + 1;
  const deletedFrames = state.frames.filter((f) => !!f.deletedAt);

  return {
    state,
    aggregatedData,
    setTimeScale,
    addFrame,
    updateFrame,
    deleteFrame,
    restoreFrame,
    permanentlyDeleteFrame,
    selectFrame,
    showToast,
    dispatch,
    todayFrameCount,
    nextFrameIndex,
    deletedFrames,
    importFrames,
    clearAllFrames,
  };
}
