"use client";

// The landing page hero: a 3D phone running a real mini board. A hand taps tiles on its own, builds a
// sentence and presses Speak, so people see (and, with sound on, hear) the experience in a few seconds.
// Anyone can take over and tap the tiles themselves. One demo set per fictional child; English (Leo)
// is the default, and the switcher shows the same board working in Hindi and Spanish.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang, Tile } from "@/lib/board/types";
import { speak } from "@/lib/client/speech";
import { BigTile } from "@/components/kid/BigTile";
import { composeSentence, tileSpeech } from "@/lib/board/sentence";
import { pick } from "@/lib/board/vocab";
import { LANGUAGES, UI } from "@/lib/i18n";
import { ConfettiLayer, makeBurst, type Burst } from "./Confetti";

type Step = { tap: string } | { say: true } | { clear: true };

interface DemoSet {
  key: string;
  name: string;
  lang: Lang;
  caption: string;
  hello: string;
  hand: string;
  core: Tile[];
  next: Tile[];
  script: Step[];
}

/** A demo tile. English is always present; `native` is the label in the set's language. */
const tile = (lang: Lang, id: string, kind: Tile["kind"], category: Tile["category"], emoji: string, en: string, native?: string): Tile => {
  const label = lang === "en" || !native ? { en } : { en, [lang]: native };
  return { id, kind, category, emoji, label, speak: label, locked: kind !== "rotating", reasons: [] };
};

// I + want + snack → speak; go + place → speak; a joke on its own; want + something shared → speak.
const SCRIPT: Step[] = [
  { tap: "core-i" },
  { tap: "core-want" },
  { tap: "snack" },
  { say: true },
  { clear: true },
  { tap: "core-go" },
  { tap: "place" },
  { say: true },
  { clear: true },
  { tap: "joke" },
  { clear: true },
  { tap: "core-want" },
  { tap: "together" },
  { say: true },
  { clear: true },
];

const SETS: DemoSet[] = [
  {
    key: "leo",
    name: "Leo",
    lang: "en",
    caption: "Leo, 8, London",
    hello: "Hello",
    hand: "👆",
    core: [tile("en", "core-i", "core", "core", "🙋", "I"), tile("en", "core-want", "core", "core", "🤲", "want"), tile("en", "core-go", "core", "core", "🚶", "go")],
    next: [
      tile("en", "place", "rotating", "places", "🛝", "Regent's Park"),
      tile("en", "snack", "rotating", "food", "🍫", "Cadbury Buttons"),
      tile("en", "show", "rotating", "favourites", "📺", "Bluey"),
      tile("en", "together", "rotating", "together", "🎵", "Beatles songs"),
      tile("en", "joke", "rotating", "fun", "😂", "Bluey wins!"),
      tile("en", "toilet", "safety", "safety", "🚽", "toilet"),
    ],
    script: SCRIPT,
  },
  {
    key: "aarav",
    name: "Aarav",
    lang: "hi",
    caption: "Aarav, 9, Delhi",
    hello: "नमस्ते",
    hand: "👆🏽",
    core: [tile("hi", "core-i", "core", "core", "🙋", "I", "मैं"), tile("hi", "core-want", "core", "core", "🤲", "want", "चाहिए"), tile("hi", "core-go", "core", "core", "🚶", "go", "चलो")],
    next: [
      tile("hi", "place", "rotating", "places", "🥟", "Sharma Chaat", "शर्मा जी चाट"),
      tile("hi", "snack", "rotating", "food", "🍪", "Parle-G", "पारले-जी"),
      tile("hi", "show", "rotating", "favourites", "📺", "Chhota Bheem", "छोटा भीम"),
      tile("hi", "together", "rotating", "together", "🎵", "Rafi songs", "रफ़ी के गाने"),
      tile("hi", "joke", "rotating", "fun", "😂", "Bheem wins!", "भीम जीतेगा!"),
      tile("hi", "toilet", "safety", "safety", "🚽", "toilet", "टॉयलेट"),
    ],
    script: SCRIPT,
  },
  {
    key: "sofia",
    name: "Sofía",
    lang: "es",
    caption: "Sofía, 12, Los Angeles",
    hello: "Hola",
    hand: "👆🏽",
    core: [tile("es", "core-i", "core", "core", "🙋", "I", "Yo"), tile("es", "core-want", "core", "core", "🤲", "want", "quiero"), tile("es", "core-go", "core", "core", "🚶", "go", "vamos")],
    next: [
      tile("es", "place", "rotating", "places", "🌮", "the taquería", "la taquería"),
      tile("es", "snack", "rotating", "food", "🌶️", "Takis", "Takis"),
      tile("es", "show", "rotating", "favourites", "🎬", "Encanto", "Encanto"),
      tile("es", "together", "rotating", "together", "🎵", "Vicente's songs", "canciones de Vicente"),
      tile("es", "joke", "rotating", "fun", "😂", "Mirabel wins!", "¡Mirabel gana!"),
      tile("es", "toilet", "safety", "safety", "🚽", "toilet", "baño"),
    ],
    script: [
      { tap: "core-i" },
      { tap: "core-want" },
      { tap: "snack" },
      { say: true },
      { clear: true },
      { tap: "core-go" },
      { tap: "place" },
      { say: true },
      { clear: true },
      { tap: "joke" },
      { clear: true },
      { tap: "core-want" },
      { tap: "show" },
      { say: true },
      { clear: true },
    ],
  },
];

const FLOATERS = [
  { e: "🧸", l: "Paddington", c: "favourites", cls: "-left-14 top-24 [--r:-8deg]", d: "0s" },
  { e: "👵", l: "Abuela", c: "people", cls: "-right-8 top-12 [--r:7deg]", d: "1.2s" },
  { e: "🧃", l: "Frooti", c: "food", cls: "-left-10 bottom-28 [--r:6deg]", d: "2.1s" },
  { e: "🎮", l: "Minecraft", c: "favourites", cls: "-right-6 bottom-40 [--r:-6deg]", d: "0.6s" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function offsetWithin(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
}

export function HeroDemo() {
  const [setKey, setSetKey] = useState(SETS[0].key);
  const demo = SETS.find((s) => s.key === setKey) ?? SETS[0];
  const lang = demo.lang;
  const ui = UI[lang];
  const isEn = lang === "en";

  const [sentence, setSentence] = useState<Tile[]>([]);
  const [said, setSaid] = useState<{ text: string; en: string; lang: Lang } | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const [hand, setHand] = useState<{ x: number; y: number; show: boolean; tap: number }>({ x: 200, y: 520, show: false, tap: 0 });
  const [soundOn, setSoundOn] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const wrap = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const targets = useRef<Record<string, HTMLElement | null>>({});
  const sound = useRef(false);
  const userUntil = useRef(0);
  const sentenceRef = useRef<Tile[]>([]);
  const langRef = useRef<Lang>(SETS[0].lang);

  const setBar = (tiles: Tile[]) => {
    sentenceRef.current = tiles;
    setSentence(tiles);
  };

  const say = useCallback((tiles: Tile[]) => {
    if (!tiles.length) return;
    const l = langRef.current;
    const text = { text: composeSentence(tiles, l), en: composeSentence(tiles, "en"), lang: l };
    setSaid(text);
    setSpeaking(true);
    if (sound.current) speak(text.text, l);
    setTimeout(() => setSpeaking(false), 2200);
    // Confetti from the Speak button (screen positions, so the 3D tilt is accounted for).
    const btn = targets.current.say;
    const box = wrap.current;
    if (btn && box && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const b = btn.getBoundingClientRect();
      const w = box.getBoundingClientRect();
      const burst = makeBurst(b.left + b.width / 2 - w.left, b.top + b.height / 2 - w.top);
      setBursts((xs) => [...xs.slice(-2), burst]);
      setTimeout(() => setBursts((xs) => xs.filter((x) => x.id !== burst.id)), 1900);
    }
  }, []);

  // A real tap by the visitor: speak it, pause the robot hand for a while.
  const userTap = (t: Tile) => {
    sound.current = true;
    setSoundOn(true);
    userUntil.current = Date.now() + 9000;
    setHand((h) => ({ ...h, show: false }));
    speak(tileSpeech(t, langRef.current), langRef.current);
    setBar([...sentenceRef.current, t].slice(-4));
  };

  // The robot hand plays the selected child's script; switching child restarts it.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const set = SETS.find((s) => s.key === setKey) ?? SETS[0];
    const byId = Object.fromEntries([...set.core, ...set.next].map((x) => [x.id, x]));
    let alive = true;
    const wait = async (ms: number) => {
      await sleep(ms);
      return alive;
    };
    (async () => {
      if (!(await wait(900))) return;
      let i = 0;
      while (alive) {
        if (Date.now() < userUntil.current || document.hidden) {
          await sleep(500);
          continue;
        }
        const step = set.script[i % set.script.length];
        i++;
        if ("clear" in step) {
          if (!(await wait(1400))) return;
          setBar([]);
          setSaid(null);
          await sleep(500);
          continue;
        }
        const id = "tap" in step ? step.tap : "say";
        const el = targets.current[id];
        const root = screen.current;
        if (!el || !root) {
          await sleep(300);
          continue;
        }
        const p = offsetWithin(el, root);
        setHand((h) => ({ ...h, x: p.x, y: p.y + 6, show: true }));
        if (!(await wait(700))) return;
        if (Date.now() < userUntil.current) continue;
        setPressed(id);
        setHand((h) => ({ ...h, tap: h.tap + 1 }));
        if ("tap" in step) {
          const t = byId[step.tap];
          if (t) {
            if (sound.current) speak(tileSpeech(t, set.lang), set.lang);
            setBar([...sentenceRef.current, t].slice(-4));
          }
        } else {
          say(sentenceRef.current);
        }
        if (!(await wait(200))) return;
        setPressed(null);
        await sleep("say" in step ? 2000 : 650);
      }
    })();
    return () => {
      alive = false;
    };
  }, [setKey, say]);

  const chooseSet = (key: string) => {
    if (key === setKey) return;
    window.speechSynthesis?.cancel();
    setBar([]);
    setSaid(null);
    setPressed(null);
    setHand((h) => ({ ...h, show: false }));
    userUntil.current = 0;
    const next = SETS.find((s) => s.key === key);
    if (!next) return;
    langRef.current = next.lang;
    setSetKey(key);
    if (sound.current) speak(next.hello, next.lang);
  };

  const toggleSound = () => {
    const next = !sound.current;
    sound.current = next;
    setSoundOn(next);
    if (next) speak(demo.hello, lang);
    else window.speechSynthesis?.cancel();
  };

  return (
    <div ref={wrap} className="relative mx-auto w-full max-w-[380px]">
      <ConfettiLayer bursts={bursts} />
      {/* Floating 3D tiles from other children's worlds. */}
      {FLOATERS.map((f) => (
        <div
          key={f.l}
          aria-hidden
          className={`float kid-tile absolute z-20 hidden h-20 w-20 text-xs font-bold sm:flex ${f.cls}`}
          style={{ background: `var(--c-${f.c})`, ["--edge" as string]: `var(--b-${f.c})`, animationDelay: f.d }}
        >
          <span className="text-3xl leading-none">{f.e}</span>
          <span className="font-display">{f.l}</span>
        </div>
      ))}

      {/* What the board just said, as a speech bubble. */}
      <div className="absolute -top-16 left-0 right-0 z-30 flex justify-center" aria-live="polite">
        {said ? (
          <div key={said.text} className="pop-in relative rounded-2xl border-2 border-[#0e5e2c] bg-white px-4 py-2 text-center shadow-[0_5px_0_#0e5e2c]">
            <p className="font-display text-lg font-extrabold leading-tight" lang={said.lang}>
              🗣️ “{said.text}”
            </p>
            {said.lang !== "en" && <p className="text-xs font-semibold text-[var(--muted)]">{said.en}</p>}
            <span aria-hidden className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-[#0e5e2c] bg-white" />
          </div>
        ) : (
          <div className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold text-[var(--muted)] shadow-sm">👆 Tap a picture. It talks in {LANGUAGES[lang].english}.</div>
        )}
      </div>

      <div className="tilt-3d">
        <div className="phone">
          <div ref={screen} className="phone-screen" lang={lang} onPointerDown={() => (userUntil.current = Date.now() + 9000)}>
            <div aria-hidden className="mx-auto mt-2 h-5 w-24 rounded-full bg-[#15141b]" />
            {/* Sentence bar */}
            <div className="m-2 flex items-center gap-2 rounded-2xl border-2 border-[var(--line)] bg-white p-1.5">
              <div className="flex min-h-11 flex-1 flex-wrap items-center gap-1 px-1">
                {sentence.length === 0 && <span className="text-xs text-[var(--muted)]">{ui.tapHint}</span>}
                {sentence.map((x, i) => (
                  <span key={`${x.id}-${i}`} className="pop-in font-display rounded-lg border-2 px-1.5 text-sm font-bold" style={{ background: `var(--c-${x.category})`, borderColor: `var(--b-${x.category})` }}>
                    {x.emoji} {pick(x.label, lang)}
                  </span>
                ))}
              </div>
              <button
                ref={(el) => {
                  targets.current.say = el;
                }}
                type="button"
                aria-label="Speak the sentence"
                onClick={() => {
                  sound.current = true;
                  setSoundOn(true);
                  userUntil.current = Date.now() + 9000;
                  say(sentenceRef.current);
                }}
                className={`kid-action relative border-[#0e5e2c] bg-[var(--go)] text-white shadow-[0_4px_0_#0e5e2c] ${pressed === "say" ? "translate-y-1 shadow-none" : ""}`}
              >
                {speaking && (
                  <>
                    <span aria-hidden className="sound-wave text-[var(--go)]" />
                    <span aria-hidden className="sound-wave text-[var(--go)] [animation-delay:0.4s]" />
                  </>
                )}
                <span aria-hidden className="text-xl">🔊</span>
                <span className="text-[11px] font-bold">{ui.speak}</span>
              </button>
            </div>

            <div className="px-2 pb-3">
              <div className="mb-2 grid grid-cols-3 gap-2">
                {demo.core.map((c) => (
                  <div key={c.id} ref={(el) => void (targets.current[c.id] = el)}>
                    <BigTile tile={c} primary={lang} secondary={isEn ? undefined : "en"} labels={isEn ? "primary" : "both"} size="xs" onTap={userTap} pressed={pressed === c.id} />
                  </div>
                ))}
              </div>
              <div className="mb-1.5 text-xs font-bold text-[var(--muted)]">
                ✨ {ui.maybeNext}
                {!isEn && <span lang="en"> · {UI.en.maybeNext}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {demo.next.map((c) => (
                  <div key={c.id} ref={(el) => void (targets.current[c.id] = el)}>
                    <BigTile tile={c} primary={lang} secondary={isEn ? undefined : "en"} labels={isEn ? "primary" : "both"} size="s" onTap={userTap} pressed={pressed === c.id} />
                  </div>
                ))}
              </div>
            </div>

            {/* The demo hand. Its fingertip sits on (x, y). */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-20 transition-[transform,opacity] duration-700 ease-[cubic-bezier(.4,.1,.2,1)]"
              style={{ transform: `translate(${hand.x}px, ${hand.y}px)`, opacity: hand.show ? 1 : 0 }}
            >
              {hand.tap > 0 && <span key={hand.tap} className="absolute left-0 top-0 h-14 w-14 rounded-full border-4 border-white/90 [animation:tapRing_.5s_ease-out_both]" />}
              <span key={`h${hand.tap}`} className="absolute -left-[18px] -top-[4px] block text-5xl drop-shadow-[0_8px_8px_rgb(0_0_0/0.35)] [animation:kidPop_.25s_ease]">
                {demo.hand}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <div role="group" aria-label="Choose a demo child and language" className="flex flex-wrap justify-center gap-1.5">
          {SETS.map((s) => (
            <button key={s.key} type="button" onClick={() => chooseSet(s.key)} aria-pressed={s.key === setKey} className="chip px-3 py-1.5 text-sm font-bold">
              {s.name} · <span lang={s.lang}>{LANGUAGES[s.lang].native}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={toggleSound} className={`btn ${soundOn ? "btn-accent" : ""}`} aria-pressed={soundOn}>
          {soundOn ? "🔊 Sound on" : "🔇 Turn on sound to hear it"}
        </button>
        <p className="text-xs text-[var(--muted)]">{demo.caption} · a fictional demo child</p>
      </div>
    </div>
  );
}
