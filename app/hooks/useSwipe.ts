"use client";

import { useRef } from "react";

export function useSwipe(onLeft: () => void, onRight: () => void) {
  const startX = useRef<number | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
  }

  function onPointerUp(e: React.PointerEvent) {
    if (startX.current === null) return;

    const delta = e.clientX - startX.current;
    const threshold = 60;

    if (delta < -threshold) onLeft(); // swipe left
    if (delta > threshold) onRight(); // swipe right

    startX.current = null;
  }

  return { onPointerDown, onPointerUp };
}
