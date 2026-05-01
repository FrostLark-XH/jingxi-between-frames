"use client";

import { useState, useEffect } from "react";

export default function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    // 768px matches Tailwind's `md:` breakpoint
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return mobile;
}
