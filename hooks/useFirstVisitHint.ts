"use client";

import { useState, useEffect, useCallback } from "react";

const VISIT_KEY = "jingxi_first_visit_complete";

export default function useFirstVisitHint() {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setIsFirstVisit(!localStorage.getItem(VISIT_KEY));
    } catch {
      setIsFirstVisit(true);
    }
    setMounted(true);
  }, []);

  const completeFirstVisit = useCallback(() => {
    setIsFirstVisit(false);
    try { localStorage.setItem(VISIT_KEY, "1"); } catch {}
  }, []);

  return { isFirstVisit, completeFirstVisit, mounted };
}
