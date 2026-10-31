"use client";

// "AI alone vs. AI + Qloo": the same child's board, first as an AI's generic guesses, then tile by tile
// as the Qloo-grounded HomeTiles board, with what Qloo added for each swap. Pairs come from a live
// build for Leo (Camden, London); the AI-alone words are typical generic guesses.

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

const PAIRS: { from: [string, string]; to: [string, string]; cat: string; sub?: string; why: string; via: string }[] = [
  { from: ["🧃", "juice"], to: ["🧃", "Ribena"], cat: "food", why: "a London favourite, checked in Qloo", via: "/search" },
  { from: ["🌳", "park"], to: ["🦁", "London Zoo"], cat: "places", sub: "860 m from home", why: "a real place 860 m from home", via: "urn:heatmap" },
  { from: ["📺", "cartoon"], to: ["🐶", "Pup Academy"], cat: "favourites", why: "fans of Bluey love it too", via: "/v2/insights" },
  { from: ["🍦", "ice cream"], to: ["🍦", "Cornetto"], cat: "food", why: "popular with kids around Camden", via: "/v2/insights" },
  { from: ["☕", "café"], to: ["🥞", "Crêpes à la carte"], cat: "places", sub: "620 m from home", why: "inside a taste hot-spot near home", via: "urn:heatmap" },
  { from: ["🎵", "music"], to: ["🎵", "Beatles songs"], cat: "together", sub: "with Grandma", why: "something Leo and Grandma can share", via: "/v2/analysis/compare" },
];

type Mode = "play" | "ai" | "qloo";

export function AiVsQloo() {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  const [mode, setMode] = useState<Mode>("play");
  const [inView, setInView] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Flip one tile at a time while visible, hold the finished board, then start again.
  useEffect(() => {
    if (mode !== "play" || !inView || reduced) return;
    const delay = n === 0 ? 1000 : n < PAIRS.length ? 1500 : 4200;
    const id = setTimeout(() => setN((x) => (x < PAIRS.length ? x + 1 : 0)), delay);
    return () => clearTimeout(id);
  }, [n, mode, inView, reduced]);

  // With reduced motion the auto-play never runs, so show the finished board.
  const shown = reduced && mode === "play" ? PAIRS.length : n;
  const latest = shown > 0 ? PAIRS[shown - 1] : null;

  const pick = (m: Mode) => {
    setMode(m);
    setN(m === "qloo" ? PAIRS.length : 0);
  };

  return (
    <div ref={box} className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[var(--surface-2)] p-1" role="radiogroup" aria-label="Which board">
            {(
              [
                ["ai", "🤖 AI alone"],
                ["qloo", "✨ AI + Qloo"],
              ] as const
            ).map(([m, l]) => {
              const on = m === "ai" ? shown === 0 : shown === PAIRS.length;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => pick(m)}
                  className={`rounded-xl px-3 py-1.5 text-sm font-bold transition-all ${on ? "bg-white shadow-[0_3px_0_var(--line)]" : "text-[var(--muted)]"}`}
                >
                  {l}
                </button>
              );
            })}
          </div>
          {!reduced && (
            <button type="button" className="btn ml-auto px-3 py-1.5 text-sm" onClick={() => pick("play")} aria-pressed={mode === "play"}>
              {mode === "play" ? "↻ Playing" : "▶ Play"}
            </button>
          )}
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Leo, 8 · Camden, London · same form, two boards</p>
        <div className="grid grid-cols-3 gap-3">
          {PAIRS.map((p, k) => (
            <div key={p.to[1]} className="flip min-h-28" data-flipped={k < shown}>
              <div className="flip-inner h-full">
                <div className="flip-face flex h-full min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#dcdcdc] bg-[#f2f2f2] grayscale">
                  <span className="text-3xl leading-none">{p.from[0]}</span>
                  <span className="font-bold text-[#6b6b6b]">{p.from[1]}</span>
                </div>
                <div className="flip-face flip-back">
                  <div className="kid-tile h-full" style={{ background: `var(--c-${p.cat})`, ["--edge" as string]: `var(--b-${p.cat})` }}>
                    <span className="text-3xl leading-none">{p.to[0]}</span>
                    <span className="font-display text-sm font-bold leading-tight">{p.to[1]}</span>
                    {p.sub && <span className="text-[10px] font-semibold opacity-70">{p.sub}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--line)]" aria-hidden>
          <div className="h-full rounded-full bg-gradient-to-r from-[#ec6233] to-[#6d4fe0] transition-[width] duration-500" style={{ width: `${(shown / PAIRS.length) * 100}%` }} />
        </div>
        <p className="mt-2 text-sm font-semibold" aria-live="polite">
          {shown === 0 ? "AI alone: generic guesses. Nothing here is his." : `${shown} of ${PAIRS.length} tiles now come from Qloo.`}
        </p>
      </div>

      <div>
        <ol className="space-y-2" aria-label="What Qloo changed">
          {PAIRS.map((p, k) => {
            const done = k < shown;
            const now = latest === p;
            return (
              <li
                key={p.to[1]}
                className={`flex items-center gap-3 rounded-2xl border-2 bg-white px-3 py-2.5 transition-all duration-500 ${now ? "border-[var(--brand)] shadow-[0_4px_0_var(--brand)]" : "border-[var(--line)]"} ${done ? "opacity-100" : "opacity-40"}`}
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
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm text-[var(--muted)]">An AI can only guess. Qloo knows what fans of his favourites love, what kids near his home like, and where those places are.</p>
      </div>
    </div>
  );
}
