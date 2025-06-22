// hooks/use-modal-scroll.ts
"use client";

import { useEffect } from "react";

export function useModalScroll() {
  useEffect(() => {
    // Store current scroll position
    const scrollY = window.scrollY;

    // Prevent body scroll and maintain position
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      // Restore scroll position and body styles
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";

      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };
  }, []);
}
