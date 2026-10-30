"use client";

import { useRouter } from "next/navigation";
import { PERSONAS } from "@/lib/personas";
import { setPendingProfile } from "@/lib/client/store";

const CARDS = [
  { key: "aarav", face: "👦🏽", name: "Aarav", sub: "9 · Rajouri Garden, Delhi", langs: "हिंदी + English", loves: ["📺 Chhota Bheem", "🎮 Minecraft", "🎵 Arijit Singh", "🍪 Parle-G"], tint: "var(--brand-soft)" },
  { key: "sofia", face: "👧🏽", name: "Sofía", sub: "12 · Boyle Heights, LA", langs: "Español + English", loves: ["🎬 Encanto", "🎤 Karol G", "🎮 Roblox", "🌶️ Takis"], tint: "var(--grape-soft)" },
] as const;

export function PersonaButtons() {
  const router = useRouter();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CARDS.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => {
            setPendingProfile(PERSONAS[c.key]);
            router.push("/generate");
          }}
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
              <span className="block text-sm font-semibold">{c.langs}</span>
            </span>
          </span>
          <span className="relative mt-4 flex flex-wrap gap-1.5">
            {c.loves.map((l) => (
              <span key={l} className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold">
                {l}
              </span>
            ))}
          </span>
          <span className="btn btn-primary relative mt-5 w-full">Build {c.name}&apos;s board live →</span>
        </button>
      ))}
    </div>
  );
}
