"use client";

// "See every screen": a walkthrough of what a parent actually sees, one step at a time, each with a
// faithful mock of that screen. Auto-advances until someone picks a step.

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type Cat = "core" | "safety" | "people" | "food" | "places" | "favourites" | "fun" | "together";

function Mini({ e, l, c, sub, badge, style }: { e: string; l: string; c: Cat; sub?: string; badge?: boolean; style?: CSSProperties }) {
  return (
    <div className="kid-tile relative min-h-[4.6rem]" style={{ background: `var(--c-${c})`, ["--edge" as string]: `var(--b-${c})`, ...style }}>
      <span className="text-2xl leading-none">{e}</span>
      <span className="font-display text-[13px] font-bold leading-tight">{l}</span>
      {sub && <span className="text-[10px] font-medium opacity-70">{sub}</span>}
      {badge && <span className="absolute -right-1.5 -top-1.5 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[var(--grape)] text-xs font-extrabold text-white shadow-[0_2px_0_#4a33a8]">?</span>}
    </div>
  );
}

function Row({ i, children }: { i: number; children: ReactNode }) {
  return (
    <div className="fade-up" style={{ animationDelay: `${i * 120}ms` }}>
      {children}
    </div>
  );
}

const STEPS: { icon: string; title: string; text: string; screen: () => ReactNode }[] = [
  {
    icon: "👋",
    title: "Tell us about your child",
    text: "First name, neighbourhood, home language and 3–5 things they love. Each favourite is checked against Qloo as you type.",
    screen: () => (
      <div className="space-y-3 p-4">
        <Row i={0}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Step 2 of 3</p>
          <p className="font-display text-lg font-extrabold">What does Aarav love?</p>
        </Row>
        <Row i={1}>
          <div className="flex flex-wrap gap-1.5">
            {["📺 Show", "🎮 Game", "🍪 Snack", "🎵 Singer"].map((c, k) => (
              <span key={c} className="chip px-2.5 py-1 text-xs" aria-pressed={k === 2}>
                {c}
              </span>
            ))}
          </div>
        </Row>
        <Row i={2}>
          <div className="input flex items-center justify-between py-2 text-sm">
            Parle<span className="animate-pulse">|</span>
            <span className="ml-auto rounded-md bg-[var(--accent-soft)] px-1.5 text-[11px] font-bold text-[var(--accent)]">✓ in Qloo</span>
          </div>
        </Row>
        <Row i={3}>
          <div className="grid grid-cols-2 gap-2">
            <Mini e="📺" l="Chhota Bheem" c="favourites" sub="✓ Qloo" />
            <Mini e="🎮" l="Minecraft" c="favourites" sub="✓ Qloo" />
            <Mini e="🎵" l="Arijit Singh" c="together" sub="✓ Qloo" />
            <Mini e="🍪" l="Parle-G" c="food" sub="✓ Qloo" style={{ animation: "popIn .5s .6s both" }} />
          </div>
        </Row>
        <Row i={4}>
          <div className="btn btn-primary w-full">✨ Build Aarav&apos;s board</div>
        </Row>
      </div>
    ),
  },
  {
    icon: "🧭",
    title: "The agent researches with Qloo",
    text: "An AI agent picks Qloo tools step by step: related favourites, snacks popular nearby, real places in taste hot-spots, things to share with grandparents.",
    screen: () => (
      <div className="space-y-2 p-4">
        <Row i={0}>
          <p className="font-display text-lg font-extrabold">Building Aarav&apos;s board…</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--line)]">
            <div className="h-full rounded-full bg-[var(--brand)] [animation:grow_4s_ease-out_both]" style={{ width: "100%" }} />
          </div>
        </Row>
        {[
          ["🔍", "Found 4 favourites in Qloo"],
          ["🌟", "Shows and games he'd love next"],
          ["🍪", "Snacks popular in West Delhi"],
          ["📍", "Taste hot-spots near home"],
          ["🤝", "Songs Aarav and Dadu both love"],
          ["📈", "What's rising at school"],
        ].map(([e, l], k) => (
          <Row key={l} i={k + 1}>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-[13px] font-semibold">
              <span>{e}</span>
              {l}
              <span className="ml-auto text-[var(--go)]">✓</span>
            </div>
          </Row>
        ))}
        <Row i={7}>
          <p className="text-center text-xs font-bold text-[var(--muted)]">41 Qloo calls · about a minute</p>
        </Row>
      </div>
    ),
  },
  {
    icon: "🗣️",
    title: "A board in their own words",
    text: "Core words never move. Below them, “For me” puts the snacks, shows and places they’re likely to want next. Every tap speaks in both languages.",
    screen: () => (
      <div className="p-3">
        <Row i={0}>
          <div className="mb-2 flex items-center gap-1 rounded-2xl border-2 border-[var(--line)] bg-white p-1.5">
            {[
              ["🙋", "मैं", "core"],
              ["🤲", "चाहिए", "core"],
              ["🍪", "पारले-जी", "food"],
            ].map(([e, l, c]) => (
              <span key={l} className="font-display rounded-lg border-2 px-1.5 text-xs font-bold" style={{ background: `var(--c-${c})`, borderColor: `var(--b-${c})` }}>
                {e} {l}
              </span>
            ))}
            <span className="ml-auto grid h-9 w-9 place-items-center rounded-xl bg-[var(--go)] text-white shadow-[0_3px_0_#0e5e2c]">🔊</span>
          </div>
        </Row>
        <Row i={1}>
          <div className="mb-2 grid grid-cols-4 gap-1.5">
            {[
              ["🙋", "मैं"],
              ["🤲", "चाहिए"],
              ["➕", "और"],
              ["✋", "रुको"],
              ["✅", "हाँ"],
              ["❌", "नहीं"],
              ["🚶", "चलो"],
            ].map(([e, l]) => (
              <div key={l} className="kid-tile min-h-[3.4rem] p-1" style={{ background: "var(--c-core)", ["--edge" as string]: "var(--b-core)" }}>
                <span className="text-lg leading-none">{e}</span>
                <span className="font-display text-[11px] font-bold">{l}</span>
              </div>
            ))}
            <div className="kid-tile min-h-[3.4rem] p-1" style={{ background: "var(--c-safety)", ["--edge" as string]: "var(--b-safety)" }}>
              <span className="text-lg leading-none">🆘</span>
              <span className="font-display text-[11px] font-bold">मदद</span>
            </div>
          </div>
        </Row>
        <Row i={2}>
          <p className="mb-1.5 text-[11px] font-bold text-[var(--muted)]">✨ शायद अब यह कहना है</p>
          <div className="grid grid-cols-3 gap-2">
            <Mini e="🍪" l="पारले-जी" c="food" sub="Parle-G" />
            <Mini e="🧃" l="फ्रूटी" c="food" sub="Frooti" />
            <Mini e="📺" l="छोटा भीम" c="favourites" sub="Chhota Bheem" />
            <Mini e="🥟" l="शर्मा जी चाट" c="places" sub="300 m" />
            <Mini e="🎵" l="रफ़ी के गाने" c="together" sub="with Dadu" />
            <Mini e="😂" l="भीम जीतेगा!" c="fun" sub="Bheem wins!" />
          </div>
        </Row>
      </div>
    ),
  },
  {
    icon: "❓",
    title: "Every tile explains itself",
    text: "Tap the purple ? on any tile to see exactly why it’s there: the Qloo signal, the distance from home, who it’s good to talk with.",
    screen: () => (
      <div className="relative p-4">
        <Row i={0}>
          <div className="mx-auto w-32">
            <Mini e="🥟" l="शर्मा जी चाट" c="places" sub="Sharma Ji Chaat" badge />
          </div>
        </Row>
        <Row i={1}>
          <div className="relative mt-4 rounded-2xl border border-[var(--line)] bg-white p-3 shadow-[var(--shadow-md)]">
            <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-[var(--line)] bg-white" />
            <p className="font-display text-base font-extrabold">Why is this tile here?</p>
            <div className="mt-2 space-y-2">
              {[
                ["📍", "Near home", "300 m from home", "var(--c-places)"],
                ["📍", "Near home", "Inside a taste hot-spot on Qloo's heatmap", "var(--c-places)"],
                ["💜", "Matches what they love", "Popular around Rajouri Garden (local affinity 0.91)", "var(--grape-soft)"],
                ["👥", "Who enjoys it", "Great with cousins and friends", "var(--c-people)"],
              ].map(([e, h, d, bg], k) => (
                <div key={d} className="fade-up flex gap-2" style={{ animationDelay: `${300 + k * 120}ms` }}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base" style={{ background: bg }}>
                    {e}
                  </span>
                  <span className="text-xs leading-snug">
                    <strong className="block">{h}</strong>
                    {d}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Row>
      </div>
    ),
  },
  {
    icon: "✅",
    title: "You approve every change",
    text: "Taps stay on the device. Each week the agent suggests new tiles from what was actually used, and nothing changes until you say yes.",
    screen: () => (
      <div className="space-y-2 p-4">
        <Row i={0}>
          <p className="font-display text-lg font-extrabold">Weekly refresh</p>
          <p className="text-xs text-[var(--muted)]">Aarav tapped Parle-G 14×, Chhota Bheem 9×</p>
        </Row>
        {[
          ["➕", "Add", "Motu Patlu", "📈 rising at school"],
          ["🔁", "Replace", "Mystery Rooms → KidZania", "💜 fits his taste"],
          ["↖️", "Move to front", "Parle-G", "👆 tapped most"],
        ].map(([e, a, l, why], k) => (
          <Row key={l} i={k + 1}>
            <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white p-2.5 text-[13px]">
              <span className="text-lg">{e}</span>
              <span className="min-w-0">
                <strong>
                  {a}: {l}
                </strong>
                <span className="block text-[11px] text-[var(--muted)]">{why}</span>
              </span>
              <span className="ml-auto grid h-6 w-10 items-center rounded-full bg-[var(--accent)] px-0.5">
                <span className="ml-auto h-5 w-5 rounded-full bg-white shadow" />
              </span>
            </label>
          </Row>
        ))}
        <Row i={4}>
          <div className="btn btn-accent w-full">Apply 3 changes</div>
        </Row>
      </div>
    ),
  },
  {
    icon: "🔒",
    title: "Hand it over, safely",
    text: "“Give to Aarav” goes full-screen and hides every menu. The back button is blocked. A parent exits by holding the lock for 2 seconds.",
    screen: () => (
      <div className="grid h-full place-items-center p-6 text-center">
        <Row i={0}>
          <div className="relative mx-auto grid h-28 w-28 place-items-center rounded-full" style={{ background: "conic-gradient(var(--brand) var(--deg), #e9e3d9 0deg)", animation: "lockFill 2.4s ease-in-out infinite" }}>
            <span className="grid h-24 w-24 place-items-center rounded-full bg-white text-5xl">🔒</span>
          </div>
        </Row>
        <Row i={1}>
          <p className="font-display mt-4 text-xl font-extrabold">Parents: keep holding…</p>
          <p className="text-sm text-[var(--muted)]">A quick tap from a child does nothing.</p>
        </Row>
      </div>
    ),
  },
];

const AUTO_MS = 6500;

export function Journey() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setI((x) => (x + 1) % STEPS.length), AUTO_MS);
    return () => clearTimeout(id);
  }, [i, auto]);

  const pick = (k: number) => {
    setAuto(false);
    setI(k);
  };
  const step = STEPS[i];

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_380px]">
      <ol className="flex snap-x gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Steps">
        {STEPS.map((s, k) => {
          const on = k === i;
          return (
            <li key={s.title} className="shrink-0 snap-start lg:shrink">
              <button
                type="button"
                onClick={() => pick(k)}
                aria-current={on ? "step" : undefined}
                className={`relative w-56 overflow-hidden rounded-2xl border-2 p-3 text-left transition-all duration-300 lg:w-full lg:p-4 ${on ? "border-[var(--brand)] bg-white shadow-[0_5px_0_var(--brand)]" : "border-transparent bg-white/50 hover:bg-white"}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl transition-transform ${on ? "scale-110 bg-[var(--brand-soft)]" : "bg-[var(--surface-2)]"}`}>{s.icon}</span>
                  <span>
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Step {k + 1}</span>
                    <span className="font-display block text-base font-extrabold leading-tight lg:text-lg">{s.title}</span>
                  </span>
                </div>
                {on && <p className="fade-up mt-2 text-sm leading-relaxed text-[#3c3a48] lg:pl-14">{s.text}</p>}
                {on && auto && <span key={i} aria-hidden className="absolute bottom-0 left-0 h-1 bg-[var(--brand)]" style={{ animation: `grow ${AUTO_MS}ms linear both` }} />}
              </button>
            </li>
          );
        })}
      </ol>

      {/* A picture of the screen; the step text above says the same thing for screen readers. */}
      <div aria-hidden className="relative mx-auto w-full max-w-[340px]">
        <div className="blob -inset-6 bg-[var(--grape)]/40" />
        <div className="phone relative">
          <div className="phone-screen h-[540px] bg-[var(--kid-bg)]">
            <div aria-hidden className="mx-auto mt-2 h-5 w-24 rounded-full bg-[#15141b]" />
            <div key={i} className="h-[calc(100%-1.75rem)]">
              {step.screen()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
