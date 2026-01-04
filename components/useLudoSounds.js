import { useEffect, useRef } from "react";

export default function useLudoSounds() {
  const ref = useRef({});

  useEffect(() => {
    ref.current = {
      dice: new Audio("/sounds/dice.mp3"),
      move: new Audio("/sounds/move.mp3"),
      win: new Audio("/sounds/win.mp3"),
    };
  }, []);

  return (name) => {
    const s = ref.current[name];
    if (!s) return;
    s.currentTime = 0;
    s.play().catch(() => {});
  };
}
