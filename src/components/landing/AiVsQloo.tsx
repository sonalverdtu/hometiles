"use client";

// "AI alone vs. AI + Qloo": the same child's board, first as an AI's generic guesses, then tile by tile
// as the Qloo-grounded HomeTiles board, with what Qloo added for each swap. Pairs come from a live
// build for Leo (Camden, London); the AI-alone words are typical generic guesses.
// The section pins to the screen and each bit of scrolling flips one more tile.

import { useEffect, useRef, useState } from "react";
import { PinHead } from "./PinHead";
import { frameThrottle, useReducedMotion } from "./useReducedMotion";

const PAIRS: { from: [string, string]; to: [string, string]; cat: string; sub?: string; why: string; via: string }[] = [
  { from: ["🧃", "juice"], to: ["🧃", "Ribena"], cat: "food", why: "a London favourite, checked in Qloo", via: "/search" },
  { from: ["🌳", "park"], to: ["🦁", "London Zoo"], cat: "places", sub: "860 m from home", why: "a real place 860 m from home", via: "urn:heatmap" },
  { from: ["📺", "cartoon"], to: ["🐶", "Pup Academy"], cat: "favourites", why: "fans of Bluey love it too", via: "/v2/insights" },
  { from: ["🍦", "ice cream"], to: ["🍦", "Cornetto"], cat: "food", why: "popular with kids around Camden", via: "/v2/insights" },
  { from: ["☕", "café"], to: ["🥞", "Crêpes à la carte"], cat: "places", sub: "620 m from home", why: "inside a taste hot-spot near home", via: "urn:heatmap" },
  { from: ["🎵", "music"], to: ["🎵", "Beatles songs"], cat: "together", sub: "with Grandma", why: "something Leo and Grandma can share", via: "/v2/analysis/compare" },
];

const HEAD = {
  eyebrow: "AI alone vs. AI + Qloo",
  title: "Same child. Two very different boards.",
  sub: "An AI alone can only guess from a child's form. Scroll, and each guess becomes the real thing Qloo finds for Leo.",
};

// Scroll stretch: one segment showing the AI-alone board, one per flip, one to hold the finished board.
const SEGMENTS = PAIRS.length + 2;

function Board({ shown, onPick }: { shown: number; onPick: (qloo: boolean) => void }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[var(--surface-2)] p-1" role="group" aria-label="Which board">
          {(
            [
              [false, "🤖 AI alone"],
              [true, "✨ AI + Qloo"],
            ] as const
          ).map(([q, l]) => {
            const on = q ? shown === PAIRS.length : shown === 0;
            return (
              <button
                key={l}
                type="button"
                aria-pressed={on}
                onClick={() => onPick(q)}
                className={`rounded-xl px-3 py-1.5 text-sm font-bold transition-all ${on ? "bg-white shadow-[0_3px_0_var(--line)]" : "text-[var(--muted)]"}`}
              >
                {l}
              </button>
            );
          })}
        </div>
        <p className="ml-auto text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Leo, 8 · Camden, London</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {PAIRS.map((p, k) => (
          <div key={p.to[1]} className="flip min-h-[clamp(4.6rem,12vh,7rem)]" data-flipped={k < shown}>
            <div className="flip-inner h-full">
              <div className="flip-face flex h-full min-h-[clamp(4.6rem,12vh,7rem)] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#dcdcdc] bg-[#f2f2f2] grayscale">
                <span className="text-2xl leading-none sm:text-3xl">{p.from[0]}</span>
                <span className="text-sm font-bold text-[#6b6b6b] sm:text-base">{p.from[1]}</span>
              </div>
              <div className="flip-face flip-back">
                <div className="kid-tile h-full" style={{ background: `var(--c-${p.cat})`, ["--edge" as string]: `var(--b-${p.cat})` }}>
                  <span className="text-2xl leading-none sm:text-3xl">{p.to[0]}</span>
                  <span className="font-display text-xs font-bold leading-tight sm:text-sm">{p.to[1]}</span>
                  {p.sub && <span className="hidden text-[10px] font-semibold opacity-70 sm:block">{p.sub}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--line)]" aria-hidden>
        <div className="h-full rounded-full bg-gradient-to-r from-[#ec6233] to-[#6d4fe0] transition-[width] duration-500" style={{ width: `${(shown / PAIRS.length) * 100}%` }} />
      </div>
      <p className="mt-2 text-sm font-semibold" aria-live="polite">
        {shown === 0 ? "AI alone: generic guesses. Nothing here is his." : `${shown} of ${PAIRS.length} tiles now come from Qloo.`}
      </p>
    </div>
  );
}

function Swap({ p, done, now }: { p: (typeof PAIRS)[number]; done: boolean; now: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border-2 bg-white px-3 py-2 transition-all duration-500 ${now ? "border-[var(--brand)] shadow-[0_4px_0_var(--brand)]" : "border-[var(--line)]"} ${done ? "opacity-100" : "opacity-40"}`}
    >
      <span className="flex shrink-0 items-center gap-1 text-sm">
        <span className="rounded-lg bg-[#f2f2f2] px-1.5 py-0.5 text-[#6b6b6b] line-through decoration-[#b9b9b9]">{p.from[1]}</span>
        <span aria-hidden>→</span>
        <span className="font-display rounded-lg px-1.5 py-0.5 font-bold" style={{ background: `var(--c-${p.cat})` }}>
          {p.to[1]}
        </span>
      </span>
      <span className="min-w-0 flex-1 text-xs leading-snug text-[#3c3a48] sm:text-sm">{p.why}</span>
      <span className="hidden shrink-0 rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--accent)] sm:inline">{p.via}</span>
    </div>
  );
}

function Layout({ shown, onPick, hint }: { shown: number; onPick: (qloo: boolean) => void; hint?: boolean }) {
  const latest = shown > 0 ? PAIRS[shown - 1] : null;
  return (
    <div className="mx-auto grid w-full max-w-6xl items-start gap-4 lg:grid-cols-2 lg:gap-6">
      <Board shown={shown} onPick={onPick} />
      {/* Desktop: every swap. Phones: just the latest one, so it all fits on one screen. */}
      <div className="hidden lg:block">
        <ol className="space-y-2" aria-label="What Qloo changed">
          {PAIRS.map((p, k) => (
            <li key={p.to[1]}>
              <Swap p={p} done={k < shown} now={latest === p} />
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-[var(--muted)]">An AI can only guess. Qloo knows what fans of his favourites love, what kids near his home like, and where those places are.</p>
      </div>
      <div className="min-h-[3.25rem] lg:hidden">{latest && <Swap key={latest.to[1]} p={latest} done now />}</div>
      {hint && shown < PAIRS.length && (
        <p className="text-center text-xs font-bold uppercase tracking-wide text-[var(--muted)] lg:col-span-2">↓ Keep scrolling to swap in Qloo</p>
      )}
    </div>
  );
}

/** Reduced motion: two buttons, nothing moves on its own. */
function AiVsQlooClick() {
  const [qloo, setQloo] = useState(true);
  return (
    <div className="py-14">
      <PinHead {...HEAD} sub="An AI alone can only guess from a child's form. Qloo finds the real things in his world." />
      <Layout shown={qloo ? PAIRS.length : 0} onPick={setQloo} />
    </div>
  );
}

function AiVsQlooScroll() {
  const outer = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = outer.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(0.9999, Math.max(0, -r.top / total)) : 0;
      setShown(Math.min(PAIRS.length, Math.floor(p * SEGMENTS)));
    };
    const { schedule, cancel } = frameThrottle(update);
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancel();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // The buttons scroll to the matching stretch, so the page and the board never disagree.
  const pick = (qloo: boolean) => {
    const el = outer.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const seg = qloo ? PAIRS.length + 0.5 : 0.5;
    window.scrollTo({ top: window.scrollY + r.top + (seg / SEGMENTS) * total, behavior: "smooth" });
  };

  return (
    <div ref={outer} className="relative" style={{ height: `${100 + SEGMENTS * 40}vh` }} data-ai-vs-qloo={shown}>
      <div className="sticky top-16 flex h-[calc(100svh-4rem)] flex-col justify-center py-3">
        <PinHead {...HEAD} />
        <Layout shown={shown} onPick={pick} hint />
      </div>
    </div>
  );
}

export function AiVsQloo() {
  return useReducedMotion() ? <AiVsQlooClick /> : <AiVsQlooScroll />;
}
