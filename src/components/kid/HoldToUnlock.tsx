"use client";

import { useEffect, useRef, useState } from "react";

const HOLD_MS = 2000;

/** Parent exit: press and hold for 2 seconds. A quick tap by a child does nothing. */
export function HoldToUnlock({ onUnlock }: { onUnlock: () => void }) {
  const [progress, setProgress] = useState(0);
  const start = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  const [hint, setHint] = useState(false);

  const stop = () => {
    start.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);
    setProgress(0);
  };

  const tick = () => {
    if (start.current === null) return;
    const p = Math.min(1, (performance.now() - start.current) / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      stop();
      onUnlock();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const begin = () => {
    if (start.current !== null) return;
    setHint(true);
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => stop(), []);
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), 2500);
    return () => clearTimeout(t);
  }, [hint]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Parent exit: press and hold for 2 seconds"
        onPointerDown={begin}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && begin()}
        onKeyUp={stop}
        onContextMenu={(e) => e.preventDefault()}
        className="grid h-12 w-12 select-none place-items-center rounded-full text-xl"
        style={{ background: `conic-gradient(var(--brand) ${progress * 360}deg, #e9e3d9 0deg)` }}
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white">🔒</span>
      </button>
      {hint && (
        <span className="absolute right-0 top-14 z-10 whitespace-nowrap rounded-lg bg-[var(--ink)] px-2 py-1 text-xs text-white">
          Parents: keep holding…
        </span>
      )}
    </div>
  );
}
