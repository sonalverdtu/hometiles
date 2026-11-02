"use client";

import { useEffect, useRef, useState } from "react";

const HOLD_MS = 2000;

/** A sum a parent answers in a second but a young child can't, so holding the lock alone never exits. */
function makeCheck() {
  const a = 3 + Math.floor(Math.random() * 6);
  const b = 4 + Math.floor(Math.random() * 6);
  const answer = a + b;
  const options = [answer, answer + 2, answer - 3].sort(() => Math.random() - 0.5);
  return { a, b, answer, options };
}

/** Parent exit: press and hold for 2 seconds, then answer a quick sum. A child's tap or hold does nothing. */
export function HoldToUnlock({ onUnlock }: { onUnlock: () => void }) {
  const [progress, setProgress] = useState(0);
  const start = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  const [check, setCheck] = useState<ReturnType<typeof makeCheck> | null>(null);

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
      setCheck(makeCheck());
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const begin = () => {
    if (start.current !== null || check) return;
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => stop(), []);
  // The check closes by itself if nobody answers, so a child left with it open is back on the board.
  useEffect(() => {
    if (!check) return;
    const t = setTimeout(() => setCheck(null), 8000);
    return () => clearTimeout(t);
  }, [check]);

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
      {check && (
        <div role="dialog" aria-label="Parent check" className="pop-in absolute right-0 top-14 z-20 w-56 rounded-2xl border border-[var(--line)] bg-white p-3 shadow-[var(--shadow-md)]">
          <p className="text-sm font-bold">Parent check: {check.a} + {check.b} = ?</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {check.options.map((n) => (
              <button
                key={n}
                type="button"
                className="btn justify-center px-0 text-lg"
                onClick={() => {
                  setCheck(null);
                  if (n === check.answer) onUnlock();
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
