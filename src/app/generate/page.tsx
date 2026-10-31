"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveBoard, takePendingProfile } from "@/lib/client/store";
import type { Profile, StreamEvent } from "@/lib/board/types";
import { LANGUAGES } from "@/lib/i18n";
import { ageGroupOf, type AgeGroup } from "@/lib/board/age";
import { TEMPERAMENT } from "@/lib/board/temperament";

const TOOL: Record<string, { icon: string; label: string; cat: string }> = {
  resolve: { icon: "🔍", label: "Favourites", cat: "favourites" },
  agent: { icon: "🧭", label: "Plan", cat: "core" },
  expand_personal_taste: { icon: "🌟", label: "More they'd love", cat: "favourites" },
  match_temperament: { icon: "🌈", label: "Fits who they are", cat: "fun" },
  find_local_brands: { icon: "🍪", label: "Local snacks", cat: "food" },
  find_toys: { icon: "🧸", label: "Toys", cat: "things" },
  find_local_places: { icon: "📍", label: "Near home", cat: "places" },
  shared_with_family: { icon: "🤝", label: "With family", cat: "together" },
  audience_profile: { icon: "👥", label: "Who to talk with", cat: "people" },
  whats_rising: { icon: "📈", label: "Rising now", cat: "fun" },
  labels: { icon: "✍️", label: "Tile words", cat: "core" },
  compose: { icon: "🧩", label: "Board", cat: "new" },
  done: { icon: "🎉", label: "Done", cat: "fun" },
};

const EXPECTED_MS = 60000;

// Hot-spot lists come through as raw geohashes ("(ttnfg7d, ttnfgm7)"); people don't need those.
const tidy = (s: string) => s.replace(/\s*\((?:[0-9a-z]{5,9}(?:,\s*)?)+\)/g, "");

interface Step {
  text: string;
  tool?: string;
}

const AGE_LABEL: Record<AgeGroup, string> = { young: "Under 8", child: "8–12", teen: "Teen", adult: "Adult" };
const TYPE_ICON: Record<string, string> = {
  "urn:entity:tv_show": "📺",
  "urn:entity:videogame": "🎮",
  "urn:entity:brand": "🍪",
  "urn:entity:artist": "🎵",
  "urn:entity:movie": "🎬",
  "urn:entity:place": "📍",
  "urn:entity:book": "📚",
  "urn:entity:podcast": "🎧",
  "urn:entity:person": "👤",
  "urn:entity:destination": "🧳",
};

/** Who the board is for, so anyone watching can check the agent's picks against it. */
function ProfileCard({ p }: { p: Profile }) {
  const langs = [p.primaryLang, p.secondaryLang].filter(Boolean).map((l) => LANGUAGES[l!].native);
  return (
    <section className="card p-5" aria-label={`${p.displayName}'s profile`}>
      <div className="flex items-center gap-3">
        <span aria-hidden className="font-display grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#ec6233] to-[#6d4fe0] text-2xl font-extrabold text-white shadow-[0_4px_0_#4a33a8]">
          {p.displayName[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">Building for</p>
          <p className="font-display truncate text-2xl font-extrabold leading-tight">{p.displayName}</p>
          <p className="text-sm text-[var(--muted)]">{AGE_LABEL[ageGroupOf(p)]}</p>
        </div>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Lives in</dt>
          <dd className="font-semibold">
            📍 {p.city}
            {p.home && <span className="ml-1 text-xs font-normal text-[var(--muted)]">(home pin shared, rounded to ~100 m)</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Speaks</dt>
          <dd className="font-semibold">🗣️ {langs.join(" + ")}</dd>
        </div>
        {p.temperament?.length ? (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">What they&apos;re like</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {p.temperament.map((t) => (
                <span key={t} className="rounded-full bg-[var(--c-fun)] px-2.5 py-1 text-xs font-semibold">
                  {TEMPERAMENT[t].emoji} {TEMPERAMENT[t].label}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Communicates</dt>
          <dd className="font-semibold">
            {p.communication === "new" ? "🌱 Just starting (smaller board)" : p.communication === "words" ? "💬 Says some words" : "🖼️ Uses a picture board"}
            {p.access?.wheelchair ? " · ♿ step-free places" : ""}
            {p.access?.quiet ? " · 🤫 quiet places" : ""}
          </dd>
        </div>
        {p.dislikes?.length ? (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Keep off the board</dt>
            <dd className="font-semibold">🚫 {p.dislikes.join(", ")}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Loves</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {p.loves.map((l) => (
              <span key={`${l.type}-${l.name}`} className="rounded-full bg-[var(--grape-soft)] px-2.5 py-1 text-xs font-semibold">
                {TYPE_ICON[l.type] ?? "💜"} {l.name}
                {l.qlooId && <span className="ml-1 text-[var(--accent)]">✓ Qloo</span>}
              </span>
            ))}
          </dd>
        </div>
        {p.family.length > 0 && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Family</dt>
            <dd className="mt-1 space-y-1">
              {p.family.map((f, i) => (
                <p key={i} className="rounded-xl bg-[var(--c-people)] px-3 py-1.5 text-xs">
                  <strong>{f.name}</strong> · {f.relation}
                  {f.loves.length > 0 && <span className="text-[var(--muted)]"> · 🎵 {f.loves.map((x) => x.name).join(", ")}</span>}
                </p>
              ))}
            </dd>
          </div>
        )}
      </dl>
      <p className="mt-4 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-xs leading-relaxed text-[var(--muted)]">
        Check the board against this: places should be near {p.city.split(",")[0]}, and shows and snacks should fit what {p.displayName} loves.
      </p>
    </section>
  );
}

export default function GeneratePage() {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([]);
  const [calls, setCalls] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [ready, setReady] = useState<{ id: string; tiles: number } | null>(null);
  const started = useRef(false);
  const list = useRef<HTMLOListElement>(null);
  const readyCard = useRef<HTMLDivElement>(null);
  const done = !!ready;
  const name = profile?.displayName ?? "";

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const profile = takePendingProfile();
    if (!profile) {
      setMissing(true);
      return;
    }
    setProfile(profile);
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
              // Wait for a tap: people may still be reading the profile and the agent's steps.
              setReady({ id: ev.board.id, tiles: Object.keys(ev.board.tiles).length });
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
  }, []);

  useEffect(() => {
    if (done || error) return;
    const t0 = Date.now() - elapsed;
    const id = setInterval(() => setElapsed(Date.now() - t0), 250);
    return () => clearInterval(id);
    // Restart only when the run ends; elapsed is read once as the starting offset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, error]);

  // Keep the newest step in view inside the list, without moving the page.
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [steps.length]);

  useEffect(() => {
    if (ready) readyCard.current?.scrollIntoView({ block: "nearest" });
  }, [ready]);

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
              <p className="text-[var(--muted)]">{done ? "Read through what the agent found, then open the board." : "The agent is researching with Qloo. This takes about a minute."}</p>
            </div>
          </div>

          {ready && (
            <div ref={readyCard} className="pop-in mt-6 rounded-[1.75rem] border-2 border-[var(--go)] bg-gradient-to-br from-[#eafaf0] to-white p-5 shadow-[0_6px_0_#0e5e2c]">
              <p className="font-display text-2xl font-extrabold">🎉 {name}&apos;s board is ready</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {ready.tiles} tiles · {calls} Qloo calls · {secs}s. Check the profile and the steps, then open it when you&apos;re ready.
              </p>
              <button type="button" className="btn btn-primary btn-lg mt-4 w-full sm:w-auto" onClick={() => router.push(`/board?id=${ready.id}`)}>
                Open {name}&apos;s board →
              </button>
            </div>
          )}

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

          <ol ref={list} className="mt-6 max-h-[50vh] min-h-40 space-y-2 overflow-y-auto overscroll-contain pb-2 pr-1" aria-live="polite" aria-label="What the agent is doing">
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

          {/* On phones the profile follows the steps, so the step in progress stays near the top. */}
          {profile && (
            <div className="mt-6 lg:hidden">
              <ProfileCard p={profile} />
            </div>
          )}

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

        <aside className="mx-auto w-full max-w-[360px] space-y-6">
          {profile && (
            <div className="hidden lg:block">
              <ProfileCard p={profile} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
