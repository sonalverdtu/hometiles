"use client";

// A small, real, tappable board on the landing page so people feel the experience in 5 seconds.

import { useState } from "react";
import type { Tile } from "@/lib/board/types";
import { speak } from "@/lib/client/speech";
import { BigTile } from "@/components/kid/BigTile";
import { composeSentence, tileSpeech } from "@/lib/board/sentence";

const t = (id: string, kind: Tile["kind"], category: Tile["category"], emoji: string, en: string, hi: string, sayEn: string, sayHi: string): Tile => ({
  id,
  kind,
  category,
  emoji,
  label: { en, hi },
  speak: { en: sayEn, hi: sayHi },
  locked: kind !== "rotating",
  reasons: [],
});

const CORE = [t("core-i", "core", "core", "🙋", "I", "मैं", "I", "मैं"), t("core-want", "core", "core", "🤲", "want", "चाहिए", "want", "चाहिए"), t("core-go", "core", "core", "🚶", "go", "चलो", "go", "चलो")];
const NEXT = [
  t("golgappe", "rotating", "places", "🥟", "Sharma Ji Chaat", "शर्मा जी चाट", "I want to go to Sharma Ji Chaat", "मुझे शर्मा जी चाट जाना है"),
  t("parleg", "rotating", "food", "🍪", "Parle-G", "पारले-जी", "I want Parle-G", "मुझे पारले-जी चाहिए"),
  t("bheem", "rotating", "favourites", "📺", "Chhota Bheem", "छोटा भीम", "Chhota Bheem is my favourite!", "छोटा भीम मेरा पसंदीदा है!"),
  t("dadu", "rotating", "together", "🎵", "Rafi songs", "रफ़ी के गाने", "Let's listen to Rafi together, Dadu!", "दादू, चलो साथ में रफ़ी सुनते हैं!"),
  t("bheem-joke", "rotating", "fun", "😂", "Bheem would beat you!", "भीम तुम्हें हरा देगा!", "Bheem would beat you!", "भीम तुम्हें हरा देगा!"),
  t("toilet", "safety", "safety", "🚽", "toilet", "टॉयलेट", "I need the toilet", "मुझे टॉयलेट जाना है"),
];

export function HeroDemo() {
  const [sentence, setSentence] = useState<Tile[]>([]);
  const [said, setSaid] = useState<string | null>(null);
  const tap = (tile: Tile) => {
    speak(tileSpeech(tile, "hi"), "hi");
    const next = [...sentence, tile].slice(-4);
    setSentence(next);
    setSaid(composeSentence(next, "hi"));
  };
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -top-5 left-6 right-6 z-10 min-h-12 rounded-2xl bg-white px-4 py-2 text-center text-lg font-bold shadow-lg" aria-live="polite">
        {said ? <>🗣️ “{said}”</> : <span className="text-base font-semibold text-[var(--muted)]">👆 Tap the tiles. It talks, in Hindi.</span>}
      </div>
      <div className="rounded-[2rem] border-[10px] border-[#2b2b2b] bg-[var(--kid-bg)] p-3 pt-10 shadow-2xl">
        <div className="mb-2 grid grid-cols-3 gap-2">
          {CORE.map((c) => (
            <BigTile key={c.id} tile={c} primary="hi" secondary="en" labels="both" size="s" onTap={tap} />
          ))}
        </div>
        <div className="mb-1 text-xs font-bold text-[var(--muted)]">✨ शायद अब यह कहना है · Maybe next</div>
        <div className="grid grid-cols-3 gap-2">
          {NEXT.map((c) => (
            <BigTile key={c.id} tile={c} primary="hi" secondary="en" labels="both" size="s" onTap={tap} />
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-[var(--muted)]">Aarav, 9, Delhi · a fictional demo child</p>
    </div>
  );
}
