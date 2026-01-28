"use client";
import { useEffect } from "react";

export function useOrientationLock(orientation = "portrait") {
  useEffect(() => {
    if (screen.orientation?.lock) {
      screen.orientation.lock(orientation).catch(() => {});
    }

    return () => {
      screen.orientation?.unlock?.();
    };
  }, [orientation]);
}
