"use client";

// "See every screen": a walkthrough of what a parent actually sees, one step at a time, each with a
// faithful mock of that screen. The section pins to the screen and scrolling moves through the steps;
// with reduced motion it's a plain tap-to-pick list.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { frameThrottle, useReducedMotion } from "./useReducedMotion";

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

// Leo's board (a fictional demo child), in English and, for the one language-support step, in Hindi.
type BoardLang = "en" | "hi";
const BOARD: Record<
  BoardLang,
  { bar: [string, string, Cat][]; core: [string, string][]; help: string; maybeNext: string; next: { e: string; l: string; c: Cat; sub?: string }[]; said?: [string, string] }
> = {
  en: {
    bar: [
      ["🙋", "I", "core"],
      ["🤲", "want", "core"],
      ["🍫", "Cadbury Buttons", "food"],
    ],
    core: [
      ["🙋", "I"],
      ["🤲", "want"],
      ["➕", "more"],
      ["✋", "stop"],
      ["✅", "yes"],
      ["❌", "no"],
      ["🚶", "go"],
    ],
    help: "help",
    maybeNext: "Maybe next",
    next: [
      { e: "🍫", l: "Cadbury Buttons", c: "food" },
      { e: "🐟", l: "Fish fingers", c: "food" },
      { e: "📺", l: "Bluey", c: "favourites" },
      { e: "🛝", l: "Regent's Park", c: "places", sub: "10 min" },
      { e: "🎵", l: "Beatles songs", c: "together", sub: "with Grandma" },
      { e: "😂", l: "Bluey wins!", c: "fun" },
    ],
  },
  hi: {
    bar: [
      ["🙋", "मैं", "core"],
      ["🤲", "चाहिए", "core"],
      ["🍫", "कैडबरी बटन्स", "food"],
    ],
    core: [
      ["🙋", "मैं"],
      ["🤲", "चाहिए"],
      ["➕", "और"],
      ["✋", "रुको"],
      ["✅", "हाँ"],
      ["❌", "नहीं"],
      ["🚶", "चलो"],
    ],
    help: "मदद",
    maybeNext: "शायद अब यह कहना है · Maybe next",
    next: [
      { e: "🍫", l: "कैडबरी बटन्स", c: "food", sub: "Cadbury Buttons" },
      { e: "🐟", l: "फ़िश फ़िंगर्स", c: "food", sub: "Fish fingers" },
      { e: "📺", l: "ब्लूई", c: "favourites", sub: "Bluey" },
      { e: "🛝", l: "रीजेंट्स पार्क", c: "places", sub: "Regent's Park" },
      { e: "🎵", l: "बीटल्स के गाने", c: "together", sub: "Beatles songs" },
      { e: "😂", l: "ब्लूई जीतेगा!", c: "fun", sub: "Bluey wins!" },
    ],
    said: ["मुझे कैडबरी बटन्स चाहिए", "I want Cadbury Buttons"],
  },
};

function BoardScreen({ lang }: { lang: BoardLang }) {
  const b = BOARD[lang];
  const o = lang === "en" ? 0 : 1;
  return (
    <div className="p-3" lang={lang}>
      {lang !== "en" && (
        <Row i={0}>
          <p lang="en" className="mb-2 flex items-center justify-center gap-1.5 rounded-full bg-[var(--grape-soft)] px-3 py-1 text-[11px] font-extrabold text-[var(--grape)]">
            🌍 Same board, in <span lang={lang}>हिंदी</span> (Hindi)
          </p>
        </Row>
      )}
      <Row i={o}>
        <div className="mb-2 flex items-center gap-1 rounded-2xl border-2 border-[var(--line)] bg-white p-1.5">
          {b.bar.map(([e, l, c]) => (
            <span key={l} className="font-display rounded-lg border-2 px-1.5 text-xs font-bold" style={{ background: `var(--c-${c})`, borderColor: `var(--b-${c})` }}>
              {e} {l}
            </span>
          ))}
          <span className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--go)] text-white shadow-[0_3px_0_#0e5e2c]">🔊</span>
        </div>
        {b.said && (
          <p className="-mt-1 mb-2 text-center text-[11px] leading-snug">
            <strong className="font-display text-xs">🗣️ “{b.said[0]}”</strong>
            <span lang="en" className="block text-[var(--muted)]">
              {b.said[1]}
            </span>
          </p>
        )}
      </Row>
      <Row i={o + 1}>
        <div className="mb-2 grid grid-cols-4 gap-1.5">
          {b.core.map(([e, l]) => (
            <div key={l} className="kid-tile min-h-[3.4rem] p-1" style={{ background: "var(--c-core)", ["--edge" as string]: "var(--b-core)" }}>
              <span className="text-lg leading-none">{e}</span>
              <span className="font-display text-[11px] font-bold">{l}</span>
            </div>
          ))}
          <div className="kid-tile min-h-[3.4rem] p-1" style={{ background: "var(--c-safety)", ["--edge" as string]: "var(--b-safety)" }}>
            <span className="text-lg leading-none">🆘</span>
            <span className="font-display text-[11px] font-bold">{b.help}</span>
          </div>
        </div>
      </Row>
      <Row i={o + 2}>
        <p className="mb-1.5 text-[11px] font-bold text-[var(--muted)]">✨ {b.maybeNext}</p>
        <div className="grid grid-cols-3 gap-2">
          {b.next.map((t) => (
            <Mini key={t.l} e={t.e} l={t.l} c={t.c} sub={t.sub} />
          ))}
        </div>
      </Row>
    </div>
  );
}

const STEPS: { icon: string; title: string; text: string; screen: () => ReactNode }[] = [
  {
    icon: "👋",
    title: "Tell us about your child",
    text: "First name, neighbourhood, language and 3–5 things they love. Each favourite is checked against Qloo as you type.",
    screen: () => (
      <div className="space-y-3 p-4">
        <Row i={0}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Step 2 of 3</p>
          <p className="font-display text-lg font-extrabold">What does Leo love?</p>
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
            Cadb<span className="animate-pulse">|</span>
            <span className="ml-auto rounded-md bg-[var(--accent-soft)] px-1.5 text-[11px] font-bold text-[var(--accent)]">✓ in Qloo</span>
          </div>
        </Row>
        <Row i={3}>
          <div className="grid grid-cols-2 gap-2">
            <Mini e="📺" l="Bluey" c="favourites" sub="✓ Qloo" />
            <Mini e="🎮" l="Minecraft" c="favourites" sub="✓ Qloo" />
            <Mini e="🧸" l="Paddington" c="favourites" sub="✓ Qloo" />
            <Mini e="🍫" l="Cadbury" c="food" sub="✓ Qloo" style={{ animation: "popIn .5s .6s both" }} />
          </div>
        </Row>
        <Row i={4}>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-[var(--muted)]">Language</span>
            <span className="chip px-2 py-0.5 text-xs" aria-pressed>
              English
            </span>
            <span className="chip px-2 py-0.5 text-xs" lang="hi">
              हिंदी
            </span>
            <span className="chip px-2 py-0.5 text-xs" lang="es">
              Español
            </span>
          </div>
        </Row>
        <Row i={5}>
          <div className="btn btn-primary w-full">✨ Build Leo&apos;s board</div>
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
          <p className="font-display text-lg font-extrabold">Building Leo&apos;s board…</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--line)]">
            <div className="h-full rounded-full bg-[var(--brand)] [animation:grow_4s_ease-out_both]" style={{ width: "100%" }} />
          </div>
        </Row>
        {[
          ["🔍", "Found 4 favourites in Qloo"],
          ["🌟", "Shows and games he'd love next"],
          ["🍫", "Snacks popular in Camden"],
          ["📍", "Taste hot-spots near home"],
          ["🤝", "Songs Leo and Grandma both love"],
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
    text: "Core words never move. Below them, “Maybe next” shows the snacks, shows and places they’re likely to want. Every tap says the word out loud.",
    screen: () => <BoardScreen lang="en" />,
  },
  {
    icon: "🌍",
    title: "In your family’s language",
    text: "English is the default. Pick Hindi or Spanish and every label, sentence and voice switches, with English underneath. Here is Leo’s same board in Hindi.",
    screen: () => <BoardScreen lang="hi" />,
  },
  {
    icon: "❓",
    title: "Every tile explains itself",
    text: "Tap the purple ? on any tile to see exactly why it’s there: the Qloo signal, the distance from home, who it’s good to talk with.",
    screen: () => (
      <div className="relative p-4">
        <Row i={0}>
          <div className="mx-auto w-32">
            <Mini e="🛝" l="Regent's Park" c="places" sub="playground" badge />
          </div>
        </Row>
        <Row i={1}>
          <div className="relative mt-4 rounded-2xl border border-[var(--line)] bg-white p-3 shadow-[var(--shadow-md)]">
            <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-[var(--line)] bg-white" />
            <p className="font-display text-base font-extrabold">Why is this tile here?</p>
            <div className="mt-2 space-y-2">
              {[
                ["📍", "Near home", "10 minutes' walk from home", "var(--c-places)"],
                ["📍", "Near home", "Inside a taste hot-spot on Qloo's heatmap", "var(--c-places)"],
                ["💜", "Matches what they love", "Popular around Camden (local affinity 0.91)", "var(--grape-soft)"],
                ["👥", "Who enjoys it", "Great with friends and Dad", "var(--c-people)"],
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
          <p className="text-xs text-[var(--muted)]">Leo tapped Cadbury Buttons 14×, Bluey 9×</p>
        </Row>
        {[
          ["➕", "Add", "Pokémon", "📈 rising at school"],
          ["🔁", "Replace", "Soft play → London Zoo", "💜 fits his taste"],
          ["↖️", "Move to front", "Cadbury Buttons", "👆 tapped most"],
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
    text: "“Give to Leo” goes full-screen and hides every menu. The back button is blocked. A parent exits by holding the lock for 2 seconds.",
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

// The phone mock is drawn at this size, then scaled to fit the screen.
const PHONE_W = 340;
const PHONE_H = 560;

/** A picture of the screen for step i; the step text says the same thing for screen readers. */
function PhoneMock({ i, fit = 1 }: { i: number; fit?: number }) {
  return (
    <div aria-hidden className="relative mx-auto shrink-0" style={{ width: PHONE_W * fit, height: PHONE_H * fit }}>
      <div className="blob -inset-6 bg-[var(--grape)]/40" />
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: PHONE_W, transform: `scale(${fit})` }}>
        <div className="phone relative">
          <div className="phone-screen h-[540px] bg-[var(--kid-bg)]">
            <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-[#15141b]" />
            <div key={i} className="h-[calc(100%-1.75rem)]">
              {STEPS[i].screen()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepButton({ k, on, onPick, progress }: { k: number; on: boolean; onPick: (k: number) => void; progress?: number }) {
  const s = STEPS[k];
  return (
    <button
      type="button"
      onClick={() => onPick(k)}
      aria-current={on ? "step" : undefined}
      className={`relative w-56 overflow-hidden rounded-2xl border-2 p-3 text-left transition-all duration-300 lg:w-full lg:p-3.5 ${on ? "border-[var(--brand)] bg-white shadow-[0_5px_0_var(--brand)]" : "border-transparent bg-white/50 hover:bg-white"}`}
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl transition-transform ${on ? "scale-110 bg-[var(--brand-soft)]" : "bg-[var(--surface-2)]"}`}>{s.icon}</span>
        <span>
          <span className="block text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Step {k + 1}</span>
          <span className="font-display block text-base font-extrabold leading-tight">{s.title}</span>
        </span>
      </div>
      {on && <p className="fade-up mt-2 text-sm leading-relaxed text-[#3c3a48] lg:pl-[3.25rem]">{s.text}</p>}
      {on && progress !== undefined && <span aria-hidden className="absolute bottom-0 left-0 h-1 bg-[var(--brand)] transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />}
    </button>
  );
}

/** Reduced motion: pick a step by tapping it. Nothing moves on its own. */
function JourneyClick() {
  const [i, setI] = useState(0);
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_380px]">
      <ol className="flex snap-x gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Steps">
        {STEPS.map((s, k) => (
          <li key={s.title} className="shrink-0 snap-start lg:shrink">
            <StepButton k={k} on={k === i} onPick={setI} />
          </li>
        ))}
      </ol>
      <PhoneMock i={i} />
    </div>
  );
}

/** Pinned to one screen: scrolling moves through the steps, then the page carries on. */
function JourneyScroll() {
  const outer = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ i: 0, within: 0, fit: 1 });

  useEffect(() => {
    const update = () => {
      const el = outer.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(0.9999, Math.max(0, -r.top / total)) : 0;
      const pos = p * STEPS.length;
      // Leave room for the header (4rem) and, on phones, the step card above the mock.
      const room = window.innerHeight - 64 - (window.innerWidth >= 1024 ? 56 : 230);
      const fit = Math.max(0.55, Math.min(1, room / PHONE_H));
      setView((v) => {
        const next = { i: Math.floor(pos), within: pos - Math.floor(pos), fit: Math.round(fit * 100) / 100 };
        return v.i === next.i && Math.abs(v.within - next.within) < 0.02 && v.fit === next.fit ? v : next;
      });
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

  // Clicking a step scrolls the page to the middle of that step's stretch.
  const go = (k: number) => {
    const el = outer.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    window.scrollTo({ top: window.scrollY + r.top + ((k + 0.5) / STEPS.length) * total, behavior: "smooth" });
  };

  const s = STEPS[view.i];
  return (
    <div ref={outer} className="relative" style={{ height: `${STEPS.length * 65 + 100}vh` }} data-journey-step={view.i}>
      <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-center py-4">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-5 lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* Desktop: every step, the current one open. */}
          <ol className="hidden flex-col gap-2 lg:flex" aria-label="Steps">
            {STEPS.map((x, k) => (
              <li key={x.title}>
                <StepButton k={k} on={k === view.i} onPick={go} progress={k === view.i ? view.within : undefined} />
              </li>
            ))}
          </ol>

          {/* Phones: dots for every step, then the current step. */}
          <div className="lg:hidden">
            <div className="mb-3 flex items-center justify-center gap-1.5" role="group" aria-label="Steps">
              {STEPS.map((x, k) => (
                <button
                  key={x.title}
                  type="button"
                  onClick={() => go(k)}
                  aria-label={`Step ${k + 1}: ${x.title}`}
                  aria-current={k === view.i ? "step" : undefined}
                  className={`grid h-9 place-items-center rounded-full text-base transition-all duration-300 ${k === view.i ? "w-14 bg-[var(--brand)] shadow-[0_3px_0_var(--brand-edge)]" : "w-9 bg-white shadow-[0_3px_0_var(--line)]"}`}
                >
                  <span aria-hidden>{x.icon}</span>
                </button>
              ))}
            </div>
            <div key={view.i} className="fade-up text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Step {view.i + 1} of {STEPS.length}
              </p>
              <p className="font-display text-xl font-extrabold leading-tight">{s.title}</p>
              <p className="mx-auto mt-1 max-w-md text-sm leading-snug text-[#3c3a48]">{s.text}</p>
            </div>
          </div>

          <PhoneMock i={view.i} fit={view.fit} />
        </div>
      </div>
    </div>
  );
}

export function Journey() {
  return useReducedMotion() ? <JourneyClick /> : <JourneyScroll />;
}
