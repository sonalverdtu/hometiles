"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PERSONAS } from "@/lib/personas";
import { saveBoard, setPendingProfile } from "@/lib/client/store";
import type { DemoRecording } from "@/lib/board/types";

// English (Freddie) first: it's the default. Kabir and Rosa show the same board in Hindi and Spanish.
const CARDS = [
  { key: "freddie", face: "👦", name: "Freddie", sub: "8 · Camden, London", langs: "English", loves: ["📺 Bluey", "🎮 Minecraft", "🧸 Paddington", "🍫 Cadbury"], tint: "var(--accent-soft)" },
  { key: "kabir", face: "👦🏽", name: "Kabir", sub: "9 · Rajouri Garden, Delhi", langs: "हिंदी (Hindi) + English", loves: ["📺 Chhota Bheem", "🎮 Minecraft", "🎵 Arijit Singh", "🍪 Parle-G"], tint: "var(--brand-soft)" },
  { key: "rosa", face: "👧🏽", name: "Rosa", sub: "12 · Boyle Heights, LA", langs: "Español (Spanish) + English", loves: ["🎬 Encanto", "🎤 Karol G", "🎮 Roblox", "🌶️ Takis"], tint: "var(--grape-soft)" },
] as const;

type Key = (typeof CARDS)[number]["key"];
const freshBoardId = () => `b-${Date.now().toString(36)}`;

export function PersonaButtons() {
  const router = useRouter();
  const [opening, setOpening] = useState<Key | null>(null);

  const buildLive = (key: Key) => {
    setPendingProfile(PERSONAS[key]);
    router.push("/generate");
  };

  // Demo children open a board recorded from a real live build (scripts/record-demos.mts): no minute-long
  // wait. Each open is a fresh copy, so taps and the weekly refresh start clean. If it can't load, build live.
  const open = async (key: Key) => {
    setOpening(key);
    try {
      const res = await fetch(`/demo/${key}.json`);
      if (!res.ok) throw new Error(String(res.status));
      const rec = (await res.json()) as DemoRecording;
      const when = new Date(rec.recordedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      const board = {
        ...rec.board,
        id: freshBoardId(),
        createdAt: new Date().toISOString(),
        notes: [`Demo board, recorded from a live build on ${when} (${Math.round(rec.ms / 1000)}s, ${rec.board.trace.length} Qloo calls).`, ...rec.board.notes],
      };
      if (!saveBoard(board)) throw new Error("storage");
      router.push(`/board?id=${board.id}`);
    } catch {
      buildLive(key);
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => open(c.key)}
            disabled={opening !== null}
            aria-busy={opening === c.key}
            className="group card relative overflow-hidden p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] active:translate-y-0.5"
          >
            <span aria-hidden className="absolute -right-10 -top-10 h-36 w-36 rounded-full transition-transform duration-500 group-hover:scale-125" style={{ background: c.tint }} />
            <span className="relative flex items-center gap-3">
              <span aria-hidden className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-white bg-[var(--surface-2)] text-4xl shadow-[0_4px_0_var(--line)] transition-transform group-hover:-rotate-6">
                {c.face}
              </span>
              <span>
                <span className="font-display block text-2xl font-extrabold leading-none">Try {c.name}</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">{c.sub}</span>
                <span className="block text-sm font-semibold">
                  <span aria-hidden>🗣️ </span>
                  <span className="sr-only">Speaks </span>
                  {c.langs}
                </span>
              </span>
            </span>
            <span className="relative mt-4 flex flex-wrap gap-1.5">
              {c.loves.map((l) => (
                <span key={l} className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold">
                  {l}
                </span>
              ))}
            </span>
            <span className="btn btn-primary relative mt-5 w-full">{opening === c.key ? "Opening…" : <>Open {c.name}&apos;s board →</>}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Want to watch the agent work? Build one live (about a minute):{" "}
        {CARDS.map((c, i) => (
          <span key={c.key}>
            {i > 0 && " · "}
            <button type="button" className="font-bold text-[var(--brand)] underline-offset-2 hover:underline" onClick={() => buildLive(c.key)}>
              {c.name}
            </button>
          </span>
        ))}
      </p>
    </>
  );
}
