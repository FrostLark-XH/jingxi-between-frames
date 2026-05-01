"use client";

import { useState, useRef, useCallback } from "react";
import useAppState from "@/hooks/useAppState";
import AppShell from "@/components/AppShell";
import ShaderBackground from "@/components/ShaderBackground";
import RecordingRoom from "@/components/RecordingRoom";
import FilmPage from "@/components/FilmPage";
import StatusToast from "@/components/StatusToast";

type View = "recording-room" | "film";

const DRAFT_KEY = "jingxi_draft";

function loadDraft(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(DRAFT_KEY) || "";
  } catch {
    return "";
  }
}

export default function HomePage() {
  const [view, setView] = useState<View>("recording-room");
  const {
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
    todayFrameCount,
    nextFrameIndex,
    deletedFrames,
  } = useAppState();

  const [draftText, setDraftText] = useState(loadDraft);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback((text: string) => {
    setDraftText(text); // immediate — keep textarea responsive
    if (typeof window === "undefined") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, text);
      } catch {
        // quota exceeded — silently skip
      }
    }, 300);
  }, []);

  const clearDraft = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDraftText("");
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
    }
  }, []);

  const handleSave = (frame: Parameters<typeof addFrame>[0]) => {
    addFrame(frame);
    clearDraft();
    showToast("已保存为一帧记忆。");
  };

  const totalFrameCount = state.frames.filter((f) => !f.deletedAt).length;
  const activeFrames = state.frames.filter((f) => !f.deletedAt);

  return (
    <>
      <ShaderBackground />
      <AppShell hideThemeSwitcher={archiveOpen}>
        {view === "recording-room" ? (
          <RecordingRoom
            draftText={draftText}
            onDraftChange={saveDraft}
            onDraftClear={clearDraft}
            onSave={handleSave}
            onViewFilm={() => setView("film")}
            todayFrameCount={todayFrameCount}
            nextFrameIndex={nextFrameIndex}
            showToast={showToast}
          />
        ) : (
          <FilmPage
            timeScale={state.timeScale}
            aggregatedData={aggregatedData}
            selectedFrame={state.selectedFrame}
            deletedFrames={deletedFrames}
            frames={activeFrames}
            totalFrameCount={totalFrameCount}
            onTimeScaleChange={setTimeScale}
            onFrameClick={selectFrame}
            onFrameClose={() => selectFrame(null)}
            onDelete={deleteFrame}
            onUpdate={updateFrame}
            onRestore={restoreFrame}
            onPermanentlyDelete={permanentlyDeleteFrame}
            onBack={() => setView("recording-room")}
            onArchiveOpenChange={setArchiveOpen}
            showToast={showToast}
          />
        )}

        <StatusToast message={state.toast} />
      </AppShell>
    </>
  );
}
