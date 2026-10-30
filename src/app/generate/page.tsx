"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveBoard, takePendingProfile } from "@/lib/client/store";
import type { StreamEvent } from "@/lib/board/types";

const TOOL: Record<string, { icon: string; label: string; cat: string }> = {
  resolve: { icon: "🔍", label: "Favourites", cat: "favourites" },
  agent: { icon: "🧭", label: "Plan", cat: "core" },
  expand_personal_taste: { icon: "🌟", label: "More they'd love", cat: "favourites" },
  match_temperament: { icon: "🌈", label: "Fits who they are", cat: "fun" },
  find_local_brands: { icon: "🍪", label: "Local snacks", cat: "food" },
  find_local_places: { icon: "📍", label: "Near home", cat: "places" },
  shared_with_family: { icon: "🤝", label: "With family", cat: "together" },
  audience_profile: { icon: "👥", label: "Who to talk with", cat: "people" },
  whats_rising: { icon: "📈", label: "Rising now", cat: "fun" },
  labels: { icon: "✍️", label: "Tile words", cat: "core" },
  compose: { icon: "🧩", label: "Board", cat: "new" },
  done: { icon: "🎉", label: "Done", cat: "fun" },
};

const EXPECTED_MS = 60000;
const SLOTS = 12;

// Hot-spot lists come through as raw geohashes ("(ttnfg7d, ttnfgm7)"); people don't need those.
const tidy = (s: string) => s.replace(/\s*\((?:[0-9a-z]{5,9}(?:,\s*)?)+\)/g, "");

interface Step {
  text: string;
  tool?: string;
}

export default function GeneratePage() {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([]);
  const [calls, setCalls] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [name, setName] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const profile = takePendingProfile();
    if (!profile) {
      setMissing(true);
      return;
    }
    setName(profile.displayName);
    (async () => {
      try {
        const res = await fetch("/api/board", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile }) });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? `Request failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let finished = false;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            const ev = JSON.parse(line) as StreamEvent;
            if (ev.type === "step") setSteps((s) => [...s, { text: tidy(ev.text), tool: ev.tool }]);
            else if (ev.type === "trace") setCalls((c) => c + 1);
            else if (ev.type === "board") {
              finished = true;
              if (!saveBoard(ev.board)) {
                setError("The board is ready, but this browser wouldn't store it (storage full or private mode). Free some space and try again.");
                continue;
              }
              setDone(true);
              setTimeout(() => router.replace(`/board?id=${ev.board.id}`), 700);
            } else if (ev.type === "error") {
              finished = true;
              setError(ev.message);
            }
          }
        }
        // The server can close the stream (time limit, dropped connection) without a board: say so instead of spinning.
        if (!finished) throw new Error("The connection closed before the board was ready. Please try again.");
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, [router]);

  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - t0), 250);
    return () => clearInterval(id);
  }, []);

  if (missing)
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-6xl">🧩</p>
        <p className="font-display mt-3 text-2xl font-extrabold">Nothing to build yet</p>
        <p className="mt-1 text-[var(--muted)]">Start by telling us a little about the child.</p>
        <Link href="/create" className="btn btn-primary btn-lg mt-6">
          ＋ Make a board
        </Link>
      </div>
    );

  const progress = done ? 100 : Math.min(95, (elapsed / EXPECTED_MS) * 95);
  const filled = steps.filter((s) => s.tool && TOOL[s.tool]).slice(0, SLOTS);
  const secs = Math.round(elapsed / 1000);

  return (
    <div className="relative overflow-x-clip">
      <div aria-hidden className="blob -left-20 top-0 h-72 w-72 bg-[#ffb48f]" />
      <div aria-hidden className="blob -right-20 top-40 h-80 w-80 bg-[#c9b8ff]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          <div className="flex items-center gap-4">
            <span aria-hidden className="relative grid h-16 w-16 shrink-0 grid-cols-2 gap-1 rounded-2xl border border-[var(--line)] bg-white p-2 shadow-[0_4px_0_var(--line)]">
              {["var(--brand)", "var(--sun)", "var(--accent)", "var(--grape)"].map((c, k) => (
                <span key={c} className="rounded-md" style={{ background: c, animation: `kidPop 1.2s ${k * 0.3}s ease-in-out infinite` }} />
              ))}
            </span>
            <div>
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{done ? `${name}'s board is ready!` : `Building ${name ? `${name}'s` : "the"} board…`}</h1>
              <p className="text-[var(--muted)]">The agent is researching with Qloo. This takes about a minute.</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="h-3 overflow-hidden rounded-full bg-[var(--line)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Progress">
              <div className="h-full rounded-full bg-gradient-to-r from-[#ec6233] via-[#f08a24] to-[#6d4fe0] transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                [String(calls), "Qloo calls"],
                [String(steps.length), "agent steps"],
                [`${secs}s`, "elapsed"],
              ].map(([v, l]) => (
                <div key={l} className="card px-4 py-3">
                  <p className="font-display text-3xl font-extrabold leading-none tabular-nums">{v}</p>
                  <p className="text-xs font-semibold text-[var(--muted)]">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <ol className="mt-6 space-y-2" aria-live="polite">
            {steps.map((s, i) => {
              const last = i === steps.length - 1 && !error && !done;
              const tool = s.tool ? TOOL[s.tool] : undefined;
              return (
                <li key={i} className={`fade-up flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 ${last ? "border-[var(--brand)] shadow-[0_4px_0_var(--brand)]" : "border-[var(--line)]"}`}>
                  <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg" style={{ background: tool ? `var(--c-${tool.cat})` : "var(--surface-2)" }}>
                    {tool?.icon ?? "•"}
                  </span>
                  <span className="min-w-0 flex-1 pt-1.5 text-[15px] leading-snug">{s.text}</span>
                  <span aria-hidden className="pt-1.5">
                    {last ? <span className="block h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" /> : <span className="font-bold text-[var(--go)]">✓</span>}
                  </span>
                </li>
              );
            })}
            {steps.length === 0 && !error && (
              <li className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--muted)]">
                <span className="block h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" /> Starting the agent…
              </li>
            )}
          </ol>

          {error && (
            <div role="alert" className="fade-up mt-6 rounded-2xl border-2 border-[#f3b0a0] bg-[#fff1ec] p-4">
              <p className="font-bold">Something went wrong: {error}</p>
              <div className="mt-3 flex gap-2">
                <Link href="/create" className="btn btn-primary">
                  Try again
                </Link>
                <Link href="/" className="btn">
                  Home
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* The board assembling as the agent works */}
        <aside aria-hidden className="mx-auto w-full max-w-[340px] lg:sticky lg:top-24">
          <div className="phone">
            <div className="phone-screen p-3">
              <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-[#15141b]" />
              <div className="mb-3 h-12 rounded-2xl border-2 border-[var(--line)] bg-white" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: SLOTS }, (_, k) => {
                  const s = filled[k];
                  const t = s?.tool ? TOOL[s.tool] : undefined;
                  return t ? (
                    <div key={k} className="kid-tile pop-in min-h-[5.2rem]" style={{ background: `var(--c-${t.cat})`, ["--edge" as string]: `var(--b-${t.cat})` }}>
                      <span className="text-3xl leading-none">{t.icon}</span>
                      <span className="font-display text-[11px] font-bold leading-tight">{t.label}</span>
                    </div>
                  ) : (
                    <div key={k} className="shimmer min-h-[5.2rem] rounded-[1.25rem]" style={{ animationDelay: `${k * 90}ms` }} />
                  );
                })}
              </div>
              {done && <p className="pop-in font-display mt-3 rounded-xl bg-[var(--go)] py-2 text-center font-extrabold text-white">🎉 Ready! Opening…</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
