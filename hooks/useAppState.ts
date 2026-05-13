"use client";

import { useReducer, useCallback, useMemo, useEffect, useRef, useState } from "react";
import type { MemoryFrame } from "@/src/domain/frame/types";
import type { TimeScale } from "@/src/domain/time/timescale";
import {
  getAggregatedYearData,
  getAggregatedMonthData,
  getAggregatedDayData,
} from "@/src/domain/time/groupFrames";
import { getTodayDateString } from "@/src/domain/time/timescale";
import { createLocalStorageFrameRepository } from "@/src/lib/storage/localStorageFrameRepository";
import { createBackup } from "@/src/lib/storage/backup";

const repo = createLocalStorageFrameRepository();

function getPreview(content: string): string {
  return content.length > 100 ? content.substring(0, 100) + "…" : content;
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
  | { type: "LOAD_FRAMES"; frames: MemoryFrame[] }
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
    case "LOAD_FRAMES":
      return { ...state, frames: action.frames };
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
      return {
        ...state,
        frames: nextFrames,
        selectedDate: action.frame.date,
        selectedMonth: action.frame.date.substring(0, 7).replace(".", ""),
        selectedYear: action.frame.date.split(".")[0],
      };
    }
    case "UPDATE_FRAME": {
      const updatedAt = new Date().toISOString();
      const applyChanges = (frame: MemoryFrame): MemoryFrame => {
        const contentChanged =
          typeof action.changes.content === "string" &&
          action.changes.content !== frame.content;

        const next: MemoryFrame = {
          ...frame,
          ...action.changes,
          updatedAt,
        };

        if (contentChanged) {
          const content = action.changes.content!;
          next.rawContent = content;
          next.preview = getPreview(content);
          next.wordCount = content.length;
          next.developStatus = next.ai || next.summary || next.tags.length > 0 ? "stale" : "idle";
        } else if (action.changes.ai) {
          next.developStatus = action.changes.ai.error ? "failed" : "developed";
        }

        return next;
      };

      const nextFrames = state.frames.map((f) =>
        f.id === action.id ? applyChanges(f) : f
      );
      return {
        ...state,
        frames: nextFrames,
        selectedFrame:
          state.selectedFrame?.id === action.id
            ? applyChanges(state.selectedFrame)
            : state.selectedFrame,
      };
    }
    case "DELETE_FRAME": {
      const nextFrames = state.frames.map((f): MemoryFrame =>
        f.id === action.id
          ? ({
              ...f,
              frameStatus: "deleted",
              deletedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } satisfies MemoryFrame)
          : f
      );
      return {
        ...state,
        frames: nextFrames,
        selectedFrame: state.selectedFrame?.id === action.id ? null : state.selectedFrame,
      };
    }
    case "RESTORE_FRAME": {
      const nextFrames = state.frames.map((f): MemoryFrame =>
        f.id === action.id
          ? ({
              ...f,
              frameStatus: "active",
              deletedAt: undefined,
              updatedAt: new Date().toISOString(),
            } satisfies MemoryFrame)
          : f
      );
      return { ...state, frames: nextFrames };
    }
    case "PERMANENTLY_DELETE_FRAME": {
      const nextFrames = state.frames.filter((f) => f.id !== action.id);
      return { ...state, frames: nextFrames };
    }
    case "IMPORT_FRAMES": {
      const incoming = action.frames
        .filter((f): f is MemoryFrame => typeof f.id === "string" && typeof f.date === "string");
      return { ...state, frames: incoming };
    }
    case "CLEAR_ALL_FRAMES":
      return { ...state, frames: [] };
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
      frames: [],
      timeScale: "day" as TimeScale,
      selectedYear: y,
      selectedMonth: m,
      selectedDate: today,
      selectedFrame: null as MemoryFrame | null,
      toast: null as string | null,
    };
  });

  const [isHydrated, setIsHydrated] = useState(false);

  // Load persisted frames after mount so SSR and client first render match.
  useEffect(() => {
    dispatch({ type: "LOAD_FRAMES", frames: repo.loadAll() });
    setIsHydrated(true);
  }, []);

  // Persist frames to storage — pure reducer, side effects isolated here
  const lastWarning = useRef<number>(0);

  useEffect(() => {
    if (!isHydrated) return;
    const result = repo.saveAll(state.frames);
    if (!result.success) {
      dispatch({ type: "SHOW_TOAST", message: result.error });
    } else if (result.sizeWarning) {
      const now = Date.now();
      if (now - lastWarning.current > 30000) {
        lastWarning.current = now;
        dispatch({
          type: "SHOW_TOAST",
          message: result.sizeWarning === "critical"
            ? "存储空间即将用完，请尽快导出数据"
            : "存储空间较紧张",
        });
      }
    }
  }, [state.frames, isHydrated]);

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
    (id: string) => {
      createBackup(state.frames);
      dispatch({ type: "PERMANENTLY_DELETE_FRAME", id });
    },
    [state.frames]
  );

  const importFrames = useCallback(
    (frames: MemoryFrame[]) => {
      createBackup(state.frames);
      dispatch({ type: "IMPORT_FRAMES", frames });
    },
    [state.frames]
  );

  const clearAllFrames = useCallback(
    () => {
      createBackup(state.frames);
      dispatch({ type: "CLEAR_ALL_FRAMES" });
    },
    [state.frames]
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
      default:
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
