"use client";
import { useEffect, useState } from "react";

export function useMobileFullscreen() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      setReady(true);
      return;
    }
    function onFirstTouch() {
      const el = document.documentElement;

      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }

      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 100);

      setReady(true);
      window.removeEventListener("touchstart", onFirstTouch);
    }


    window.addEventListener("touchstart", onFirstTouch, { once: true });

    return () =>
      window.removeEventListener("touchstart", onFirstTouch);
  }, []);

  return ready;
}

