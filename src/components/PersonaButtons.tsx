"use client";

import { useRouter } from "next/navigation";
import { PERSONAS } from "@/lib/personas";
import { setPendingProfile } from "@/lib/client/store";

const CARDS = [
  { key: "aarav", flag: "👦🏽", title: "Try Aarav", sub: "9 · Rajouri Garden, Delhi · Hindi + English", loves: "Chhota Bheem, Minecraft, Arijit Singh, Parle-G" },
  { key: "sofia", flag: "👧🏽", title: "Try Sofía", sub: "12 · Boyle Heights, LA · Spanish + English", loves: "Encanto, Karol G, Roblox, Takis" },
] as const;

export function PersonaButtons() {
  const router = useRouter();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {CARDS.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => {
            setPendingProfile(PERSONAS[c.key]);
            router.push("/generate");
          }}
          className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-lg font-bold">
            <span aria-hidden className="text-2xl">{c.flag}</span> {c.title}
            <span className="ml-auto text-sm font-semibold text-[var(--brand)] group-hover:underline">Build board →</span>
          </div>
          <div className="mt-1 text-sm text-[var(--muted)]">{c.sub}</div>
          <div className="mt-2 text-sm">
            <span className="font-semibold">Loves:</span> {c.loves}
          </div>
        </button>
      ))}
    </div>
  );
}
