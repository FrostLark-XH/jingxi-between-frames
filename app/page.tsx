"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import useAppState from "@/hooks/useAppState";
import AppShell from "@/components/AppShell";
import ShaderBackground from "@/components/ShaderBackground";
import RecordingRoom from "@/components/RecordingRoom";
import FilmPage from "@/components/FilmPage";
import StatusToast from "@/components/StatusToast";
import DataManager from "@/components/DataManager";
import { track } from "@/lib/analytics";

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
    importFrames,
    clearAllFrames,
  } = useAppState();

  const [draftText, setDraftText] = useState(loadDraft);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [dataManagerOpen, setDataManagerOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackedAppOpen = useRef(false);

  const totalFrameCount = state.frames.filter((f) => !f.deletedAt).length;
  const activeFrames = state.frames.filter((f) => !f.deletedAt);

  // app_open — once per mount
  useEffect(() => {
    if (!trackedAppOpen.current) {
      trackedAppOpen.current = true;
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      let displayMode = "browser";
      if (typeof window !== "undefined") {
        if (window.matchMedia("(display-mode: standalone)").matches) {
          displayMode = "standalone";
        } else if (window.matchMedia("(display-mode: fullscreen)").matches) {
          displayMode = "fullscreen";
        }
      }
      track("app_open", {
        deviceType: isMobile ? "mobile" : "desktop",
        displayMode,
      });
    }
  }, []);

  const saveDraft = useCallback((text: string) => {
    setDraftText(text);
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
    const wasFirstFrame = totalFrameCount === 0;
    addFrame(frame);
    clearDraft();
    showToast("已保存为一帧记忆。");
    if (wasFirstFrame) {
      track("first_frame_created");
    }
  };

  const handleViewFilm = () => {
    setView("film");
    track("film_opened");
  };

  const handleBackToRecording = () => {
    setView("recording-room");
  };

  return (
    <>
      <ShaderBackground />
      <AppShell hideThemeSwitcher={archiveOpen || dataManagerOpen}>
        {view === "recording-room" ? (
          <RecordingRoom
            draftText={draftText}
            onDraftChange={saveDraft}
            onDraftClear={clearDraft}
            onSave={handleSave}
            onUpdateFrame={updateFrame}
            onViewFilm={handleViewFilm}
            onOpenDataManager={() => setDataManagerOpen(true)}
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
            onBack={handleBackToRecording}
            onOpenDataManager={() => setDataManagerOpen(true)}
            onArchiveOpenChange={setArchiveOpen}
            showToast={showToast}
          />
        )}

        <DataManager
          open={dataManagerOpen}
          onClose={() => setDataManagerOpen(false)}
          frameCount={totalFrameCount}
          allFrames={state.frames}
          onImport={importFrames}
          onClearAll={clearAllFrames}
          showToast={showToast}
        />

        <StatusToast message={state.toast} />
      </AppShell>
    </>
  );
}
