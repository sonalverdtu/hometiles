"use client";

// "How HomeTiles uses Qloo": one board's journey through the real system, stage by stage. Each stage
// switches on as it scrolls into view, a line fills down the spine, and a packet shows what travels on.
// Every box matches the code: src/app/api/board, src/lib/agent (run + toolbox), src/lib/qloo,
// src/lib/board/engine, src/lib/client/store, src/app/api/refresh.

import { useEffect, useRef } from "react";
import { frameThrottle, useReducedMotion } from "./useReducedMotion";

type Zone = "browser" | "server" | "qloo" | "device";

const ZONE: Record<Zone, { label: string; bg: string; ink: string }> = {
  browser: { label: "Browser", bg: "var(--brand-soft)", ink: "#b43a15" },
  server: { label: "Server · Vercel", bg: "var(--grape-soft)", ink: "var(--grape)" },
  qloo: { label: "Qloo taste graph", bg: "var(--accent-soft)", ink: "var(--accent)" },
  device: { label: "On the device", bg: "var(--c-core)", ink: "#7a5b00" },
};

const TOOLS: { e: string; name: string; api: string; does: string }[] = [
  { e: "🌟", name: "expand_personal_taste", api: "/v2/insights · signal.interests.entities", does: "Shows, films, games and music that fans of their favourites love" },
  { e: "🙂", name: "match_temperament", api: "/v2/insights · signal.interests.tags", does: "Calm or energetic picks, from Qloo's descriptor tags" },
  { e: "🍫", name: "find_local_brands", api: "/v2/insights · urn:entity:brand + location", does: "Snacks popular where they live; the LLM proposes, Qloo verifies" },
  { e: "📍", name: "find_local_places", api: "urn:heatmap → urn:entity:place", does: "Hottest taste cells near home, then real places inside them" },
  { e: "🤝", name: "shared_with_family", api: "/v2/analysis/compare → /v2/insights", does: "Tags a child and grandparent share, turned into things to enjoy together" },
  { e: "👥", name: "audience_profile", api: "urn:demographics", does: "Which age groups love each pick, so tiles fit the conversation" },
  { e: "📈", name: "whats_rising", api: "/v2/trending · bias.trends", does: "Rising picks, so the child can join in at school" },
];

const STAGES: { zone: Zone; e: string; title: string; text: string; chips: string[]; flow?: string; tools?: boolean }[] = [
  {
    zone: "browser",
    e: "👪",
    title: "A parent answers 3 short steps",
    text: "Neighbourhood, language, age group, what the child is like, 3–5 favourites and family. Each favourite is checked against Qloo as they type.",
    chips: ["/create", "POST /api/resolve", "/search"],
    flow: "the profile · names never go to Qloo or the AI",
  },
  {
    zone: "server",
    e: "🌊",
    title: "One streaming request",
    text: "The browser opens one request and watches the build live: every agent step and every Qloo call stream back as they happen.",
    chips: ["POST /api/board", "NDJSON stream", "4 builds / min / IP"],
    flow: "favourite names + their types",
  },
  {
    zone: "qloo",
    e: "🔍",
    title: "Favourites become Qloo IDs",
    text: "Each favourite is searched by type and name-checked, so “Paddington” means the film, not the station.",
    chips: ["/search", "tv_show · movie · videogame · brand · artist"],
    flow: "Qloo IDs + city + age band",
  },
  {
    zone: "server",
    e: "🧭",
    title: "A Gemini agent plans the research",
    text: "With function calling, Gemini decides which Qloo tools to run and in what order, inside a 60-second budget. Its brief has no names. Any tool it skips, a scripted planner runs.",
    chips: ["gemini-3.5-flash", "function calling", "fallback: 3.5 Flash-lite"],
    flow: "tool calls",
  },
  {
    zone: "qloo",
    e: "🕸️",
    title: "Seven tools, each a real Qloo call",
    text: "Every call goes through one facade: cache, a trace of each request, at most 2 in flight, back-off on 429.",
    chips: ["hackathon.api.qloo.com"],
    flow: "entities + affinity + why (explainability)",
    tools: true,
  },
  {
    zone: "server",
    e: "🛡️",
    title: "A safety screen for children",
    text: "Each result is checked against the child's age group: content ratings, a kids' genre for under-13s, ESRB for games, and no bars, energy drinks or coffee.",
    chips: ["ageSafe()", "filter.content_rating", "filter.exclude.tags"],
    flow: "safe candidates",
  },
  {
    zone: "server",
    e: "🧩",
    title: "The board engine ranks and lays out",
    text: "score = 0.55 affinity + 0.25 local fit + 0.15 age fit + 0.05 popularity. Then folder quotas, fixed core-word slots, words in the family's language and ARASAAC pictograms.",
    chips: ["engine.ts", "8 folders", "Gemini labels, template fallback", "ARASAAC"],
    flow: "the board, as JSON",
  },
  {
    zone: "device",
    e: "📱",
    title: "The board lives on the device",
    text: "Board, taps and sentences stay in localStorage. “For me” predicts the next word on the phone itself: word pairs, time of day, the live topic. Nothing is sent.",
    chips: ["localStorage", "Web Speech API", "child lock"],
    flow: "weekly: Qloo IDs + tap counts only",
  },
  {
    zone: "server",
    e: "🔄",
    title: "Weekly refresh, the parent decides",
    text: "Only anonymous Qloo IDs and tap counts go up. The most-tapped picks seed new Qloo insights; the parent ticks each change. Core, safety, family and locked tiles never move.",
    chips: ["POST /api/refresh", "/v2/insights", "≤ 2 replace · ≤ 2 move"],
  },
];

export function Architecture() {
  const reduced = useReducedMotion();
  const root = useRef<HTMLOListElement>(null);

  // Scroll drives everything without re-rendering: stages get data-on, the spine gets --fill.
  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    el.classList.add("arch-armed");
    const update = () => {
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      const fill = Math.min(1, Math.max(0, (vh * 0.7 - r.top) / r.height));
      el.style.setProperty("--fill", String(fill));
      el.querySelectorAll<HTMLElement>("[data-stage]").forEach((s) => {
        s.dataset.on = String(s.getBoundingClientRect().top < vh * 0.8);
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
      el.classList.remove("arch-armed");
    };
  }, [reduced]);

  return (
    <div>
      <ul className="mb-10 flex flex-wrap justify-center gap-2 text-xs font-bold" aria-label="Where each stage runs">
        {(Object.keys(ZONE) as Zone[]).map((z) => (
          <li key={z} className="rounded-full px-3 py-1" style={{ background: ZONE[z].bg, color: ZONE[z].ink }}>
            {ZONE[z].label}
          </li>
        ))}
      </ul>

      <ol ref={root} className="arch relative mx-auto max-w-5xl space-y-10" aria-label="How a board is built">
        {/* The spine, and the part of it the journey has reached. */}
        <span aria-hidden className="absolute bottom-0 left-5 top-0 w-1 -translate-x-1/2 rounded-full bg-[var(--line)] lg:left-1/2" />
        <span aria-hidden className="arch-fill absolute left-5 top-0 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ec6233] via-[#6d4fe0] to-[#0f7b6c] lg:left-1/2">
          <span className="arch-head absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_4px_#6d4fe0,0_0_18px_6px_rgb(109_79_224/0.5)]" />
        </span>

        {STAGES.map((s, k) => {
          const z = ZONE[s.zone];
          const left = k % 2 === 0;
          const wide = !!s.tools;
          return (
            <li
              key={s.title}
              data-stage
              className={`arch-stage relative pl-14 lg:pl-0 ${wide ? "lg:px-0" : left ? "lg:w-1/2 lg:pr-12" : "lg:ml-auto lg:w-1/2 lg:pl-12"}`}
            >
              <span
                aria-hidden
                className={`arch-node absolute left-0 top-3 grid h-10 w-10 place-items-center rounded-2xl border-2 border-white text-xl shadow-[0_4px_0_rgb(0_0_0/0.12)] ${
                  wide ? "lg:-top-6 lg:left-1/2 lg:-translate-x-1/2" : left ? "lg:left-auto lg:right-0 lg:translate-x-1/2" : "lg:left-0 lg:-translate-x-1/2"
                }`}
                style={{ background: z.bg }}
              >
                {s.e}
              </span>

              <div className={`card relative p-4 sm:p-5 ${wide ? "lg:mx-auto lg:max-w-4xl lg:pt-7" : ""}`}>
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em]" style={{ color: z.ink }}>
                  {k + 1} · {z.label}
                </p>
                <h3 className="text-xl font-extrabold leading-tight sm:text-2xl">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#3c3a48] sm:text-[15px]">{s.text}</p>

                {s.tools && (
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {TOOLS.map((t, j) => (
                      <li key={t.name} className="arch-tool rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3" style={{ transitionDelay: `${j * 90}ms` }}>
                        <p className="flex items-center gap-1.5 font-mono text-[12px] font-bold">
                          <span aria-hidden className="font-sans text-base">
                            {t.e}
                          </span>
                          {t.name}
                        </p>
                        <p className="mt-1 text-xs leading-snug text-[#3c3a48]">{t.does}</p>
                        <p className="mt-1.5 break-words rounded-md bg-white px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--accent)]">{t.api}</p>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.chips.map((c) => (
                    <span key={c} className="break-all rounded-md bg-[#1d1b26] px-2 py-0.5 font-mono text-[11px] text-white sm:break-normal">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {s.flow && (
                <p className={`arch-flow mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-bold shadow-sm ${wide ? "lg:ml-[calc(50%+1.5rem)]" : ""}`}>
                  <span aria-hidden className="arch-packet h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--grape)]" />
                  <span className="sr-only">Passes on: </span>
                  {s.flow}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-[var(--muted)]">
        ↺ And around again: each week the board grows with the child, and every tile keeps its Qloo evidence behind the purple <strong className="text-[var(--grape)]">?</strong>.
      </p>
    </div>
  );
}
