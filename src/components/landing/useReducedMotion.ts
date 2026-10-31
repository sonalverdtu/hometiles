"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Runs `fn` at most once per frame for scroll-driven effects. A short timer backs up the animation
 * frame, because some embedded and background browsers never deliver frames.
 */
export function frameThrottle(fn: () => void) {
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    raf = 0;
    timer = undefined;
    fn();
  };
  return {
    schedule() {
      if (raf || timer) return;
      raf = requestAnimationFrame(run);
      timer = setTimeout(run, 80);
    },
    cancel() {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    },
  };
}

/** True when the visitor asked for less motion. False on the server and during hydration. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
