"use client";

// The landing page hero: a 3D phone running a real mini board. A hand taps tiles on its own, builds a
// sentence and presses Speak, so people see (and, with sound on, hear) the experience in a few seconds.
// Anyone can take over and tap the tiles themselves.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Tile } from "@/lib/board/types";
import { speak } from "@/lib/client/speech";
import { BigTile } from "@/components/kid/BigTile";
import { composeSentence, tileSpeech } from "@/lib/board/sentence";

const t = (id: string, kind: Tile["kind"], category: Tile["category"], emoji: string, en: string, hi: string): Tile => ({
  id,
  kind,
  category,
  emoji,
  label: { en, hi },
  speak: { en, hi },
  locked: kind !== "rotating",
  reasons: [],
});

const CORE = [t("core-i", "core", "core", "🙋", "I", "मैं"), t("core-want", "core", "core", "🤲", "want", "चाहिए"), t("core-go", "core", "core", "🚶", "go", "चलो")];
const NEXT = [
  t("chaat", "rotating", "places", "🥟", "Sharma Chaat", "शर्मा जी चाट"),
  t("parleg", "rotating", "food", "🍪", "Parle-G", "पारले-जी"),
  t("bheem", "rotating", "favourites", "📺", "Chhota Bheem", "छोटा भीम"),
  t("rafi", "rotating", "together", "🎵", "Rafi songs", "रफ़ी के गाने"),
  t("joke", "rotating", "fun", "😂", "Bheem wins!", "भीम जीतेगा!"),
  t("toilet", "safety", "safety", "🚽", "toilet", "टॉयलेट"),
];
const ALL = Object.fromEntries([...CORE, ...NEXT].map((x) => [x.id, x]));

type Step = { tap: string } | { say: true } | { clear: true };
const SCRIPT: Step[] = [
  { tap: "core-i" },
  { tap: "core-want" },
  { tap: "parleg" },
  { say: true },
  { clear: true },
  { tap: "core-go" },
  { tap: "chaat" },
  { say: true },
  { clear: true },
  { tap: "joke" },
  { clear: true },
  { tap: "core-want" },
  { tap: "rafi" },
  { say: true },
  { clear: true },
];

const FLOATERS = [
  { e: "🌶️", l: "Takis", c: "food", cls: "-left-14 top-24 [--r:-8deg]", d: "0s" },
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
  const [sentence, setSentence] = useState<Tile[]>([]);
  const [said, setSaid] = useState<{ hi: string; en: string } | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const [hand, setHand] = useState<{ x: number; y: number; show: boolean; tap: number }>({ x: 200, y: 520, show: false, tap: 0 });
  const [soundOn, setSoundOn] = useState(false);
  const screen = useRef<HTMLDivElement>(null);
  const targets = useRef<Record<string, HTMLElement | null>>({});
  const sound = useRef(false);
  const userUntil = useRef(0);
  const sentenceRef = useRef<Tile[]>([]);

  const setBar = (tiles: Tile[]) => {
    sentenceRef.current = tiles;
    setSentence(tiles);
  };

  const say = useCallback((tiles: Tile[]) => {
    if (!tiles.length) return;
    const text = { hi: composeSentence(tiles, "hi"), en: composeSentence(tiles, "en") };
    setSaid(text);
    setSpeaking(true);
    if (sound.current) speak(text.hi, "hi");
    setTimeout(() => setSpeaking(false), 2200);
  }, []);

  // A real tap by the visitor: speak it, pause the robot hand for a while.
  const userTap = (tile: Tile) => {
    sound.current = true;
    setSoundOn(true);
    userUntil.current = Date.now() + 9000;
    setHand((h) => ({ ...h, show: false }));
    speak(tileSpeech(tile, "hi"), "hi");
    setBar([...sentenceRef.current, tile].slice(-4));
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    (async () => {
      await sleep(900);
      let i = 0;
      while (alive) {
        if (Date.now() < userUntil.current || document.hidden) {
          await sleep(500);
          continue;
        }
        const step = SCRIPT[i % SCRIPT.length];
        i++;
        if ("clear" in step) {
          await sleep(1400);
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
        await sleep(700);
        if (!alive || Date.now() < userUntil.current) continue;
        setPressed(id);
        setHand((h) => ({ ...h, tap: h.tap + 1 }));
        if ("tap" in step) {
          const tile = ALL[step.tap];
          if (sound.current) speak(tileSpeech(tile, "hi"), "hi");
          setBar([...sentenceRef.current, tile].slice(-4));
        } else {
          say(sentenceRef.current);
        }
        await sleep(200);
        setPressed(null);
        await sleep("say" in step ? 2000 : 650);
      }
    })();
    return () => {
      alive = false;
    };
  }, [say]);

  const toggleSound = () => {
    const next = !sound.current;
    sound.current = next;
    setSoundOn(next);
    if (next) speak("नमस्ते", "hi");
    else window.speechSynthesis?.cancel();
  };

  return (
    <div className="relative mx-auto w-full max-w-[380px]">
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
          <div key={said.hi} className="pop-in relative rounded-2xl border-2 border-[#0e5e2c] bg-white px-4 py-2 text-center shadow-[0_5px_0_#0e5e2c]">
            <p className="font-display text-lg font-extrabold leading-tight">🗣️ “{said.hi}”</p>
            <p className="text-xs font-semibold text-[var(--muted)]">{said.en}</p>
            <span aria-hidden className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-[#0e5e2c] bg-white" />
          </div>
        ) : (
          <div className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold text-[var(--muted)] shadow-sm">👆 Tap the tiles. It talks, in Hindi.</div>
        )}
      </div>

      <div className="tilt-3d">
        <div className="phone">
          <div ref={screen} className="phone-screen" onPointerDown={() => (userUntil.current = Date.now() + 9000)}>
            <div aria-hidden className="mx-auto mt-2 h-5 w-24 rounded-full bg-[#15141b]" />
            {/* Sentence bar */}
            <div className="m-2 flex items-center gap-2 rounded-2xl border-2 border-[var(--line)] bg-white p-1.5">
              <div className="flex min-h-11 flex-1 flex-wrap items-center gap-1 px-1">
                {sentence.length === 0 && <span className="text-xs text-[var(--muted)]">टाइल दबाओ…</span>}
                {sentence.map((x, i) => (
                  <span key={`${x.id}-${i}`} className="pop-in font-display rounded-lg border-2 px-1.5 text-sm font-bold" style={{ background: `var(--c-${x.category})`, borderColor: `var(--b-${x.category})` }}>
                    {x.emoji} {x.label.hi}
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
                <span className="text-[11px] font-bold">बोलो</span>
              </button>
            </div>

            <div className="px-2 pb-3">
              <div className="mb-2 grid grid-cols-3 gap-2">
                {CORE.map((c) => (
                  <div key={c.id} ref={(el) => void (targets.current[c.id] = el)}>
                    <BigTile tile={c} primary="hi" secondary="en" labels="both" size="xs" onTap={userTap} pressed={pressed === c.id} />
                  </div>
                ))}
              </div>
              <div className="mb-1.5 text-xs font-bold text-[var(--muted)]">✨ शायद अब यह कहना है · Maybe next</div>
              <div className="grid grid-cols-3 gap-2">
                {NEXT.map((c) => (
                  <div key={c.id} ref={(el) => void (targets.current[c.id] = el)}>
                    <BigTile tile={c} primary="hi" secondary="en" labels="both" size="s" onTap={userTap} pressed={pressed === c.id} />
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
              <span key={`h${hand.tap}`} className="absolute -left-[18px] -top-[4px] block text-5xl drop-shadow-[0_8px_8px_rgb(0_0_0/0.35)] [animation:kidPop_.25s_ease]">👆🏽</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <button type="button" onClick={toggleSound} className={`btn ${soundOn ? "btn-accent" : ""}`} aria-pressed={soundOn}>
          {soundOn ? "🔊 Sound on" : "🔇 Turn on sound to hear it"}
        </button>
        <p className="text-xs text-[var(--muted)]">Aarav, 9, Delhi · a fictional demo child</p>
      </div>
    </div>
  );
}
