import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { PersonaButtons } from "@/components/PersonaButtons";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { Journey } from "@/components/landing/Journey";
import { LANGUAGES, type Lang } from "@/lib/i18n";

const GENERIC = [
  { e: "🍪", l: "cookie" },
  { e: "🌳", l: "park" },
  { e: "📺", l: "cartoon" },
  { e: "🧃", l: "juice" },
  { e: "👩", l: "mom" },
  { e: "⚽", l: "ball" },
];
// Leo, 8, Camden (a fictional demo child).
const HOME = [
  { e: "🍫", l: "Cadbury Buttons", c: "food" },
  { e: "🛝", l: "Regent's Park playground", s: "10 min from home", c: "places" },
  { e: "📺", l: "Bluey", c: "favourites" },
  { e: "🧸", l: "Paddington", c: "favourites" },
  { e: "👵", l: "Grandma", c: "people" },
  { e: "🎵", l: "Beatles songs", s: "with Grandma", c: "together" },
];

// The same idea for other demo children, in their family's language.
const ELSEWHERE: { who: string; lang: Lang; words: [string, string][] }[] = [
  { who: "Aarav in Delhi", lang: "hi", words: [["🍪", "पारले-जी"], ["👴", "दादू"]] },
  { who: "Sofía in Los Angeles", lang: "es", words: [["🌶️", "Takis"], ["👵", "Abuela"]] },
];

// Words from many children's worlds, scrolling under the hero. Mostly English; a few show other languages.
const WORLD: readonly (readonly [string, string, string, Lang?])[] = [
  ["🍫", "Cadbury Buttons", "food"],
  ["📺", "Bluey", "favourites"],
  ["🛝", "Regent's Park", "places"],
  ["👵", "Grandma", "people"],
  ["🍪", "Parle-G", "food", "hi"],
  ["🎮", "Minecraft", "favourites"],
  ["🧸", "Paddington", "favourites"],
  ["🎬", "Encanto", "favourites", "es"],
  ["🎵", "Beatles songs", "together"],
  ["🐟", "Fish fingers", "food"],
  ["👵", "Abuela", "people", "es"],
  ["🚌", "Big red bus", "fun"],
  ["🥟", "Golgappe", "places", "hi"],
  ["🌶️", "Takis", "food", "es"],
];

const tileStyle = (c: string): CSSProperties => ({ background: `var(--c-${c})`, ["--edge" as string]: `var(--b-${c})` });

function Section({ id, eyebrow, title, sub, children, className = "" }: { id?: string; eyebrow: string; title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 py-16 sm:py-20 ${className}`}>
      <div className="reveal mx-auto max-w-6xl">
        <p className="text-center text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand)]">{eyebrow}</p>
        <h2 className="mx-auto mt-2 max-w-3xl text-center text-3xl font-extrabold leading-tight sm:text-5xl">{title}</h2>
        {sub && <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-[var(--muted)]">{sub}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative">
        <div aria-hidden className="blob -left-24 top-10 h-72 w-72 bg-[#ffb48f]" />
        <div aria-hidden className="blob right-0 top-40 h-80 w-80 bg-[#c9b8ff]" />
        <div aria-hidden className="blob bottom-0 left-1/3 h-64 w-64 bg-[#a8e6d9]" />
        <div className="relative mx-auto grid max-w-6xl gap-16 px-4 pb-16 pt-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-16">
          <div className="fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-sm font-bold shadow-sm">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--grape)] text-[10px] text-white">✦</span>
              An AI agent + Qloo&apos;s taste graph
            </p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] sm:text-7xl">
              A talking picture board that <span className="text-gradient">sounds like home.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#3c3a48]">
              Children who can&apos;t speak (yet) talk by tapping pictures. Most boards only know <em>&ldquo;cookie&rdquo;</em> and <em>&ldquo;park&rdquo;</em>. HomeTiles builds one in about a minute with the{" "}
              <strong>snacks, shows, places and family a child actually knows</strong>. It speaks English, Hindi and Spanish, so it works in your family&apos;s language.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/create" className="btn btn-primary btn-lg">
                ＋ Make a board for my child
              </Link>
              <a href="#try" className="btn btn-lg">
                ▶ Try a demo child
              </a>
            </div>
            <ul className="mt-8 grid max-w-lg grid-cols-2 gap-2 text-sm font-semibold">
              {[
                ["🗣️", "English, Hindi, Spanish"],
                ["🔒", "Child lock"],
                ["📴", "Taps stay on the device"],
                ["✅", "Parents approve changes"],
              ].map(([e, l]) => (
                <li key={l} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                  <span aria-hidden>{e}</span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-16 lg:pt-0">
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* WORLD MARQUEE */}
      <section aria-label="Words from children's own worlds" className="border-y border-[var(--line)] bg-white/60 py-5">
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="marquee gap-3">
            {[...WORLD, ...WORLD].map(([e, l, c, lang], k) => (
              <div key={k} aria-hidden={k >= WORLD.length} className="kid-tile relative h-[4.5rem] w-28 shrink-0 text-sm font-bold" style={tileStyle(c)}>
                {lang && (
                  <span lang={lang} className="absolute right-1.5 top-1 rounded-full bg-white/80 px-1.5 text-[9px] font-extrabold leading-4">
                    {LANGUAGES[lang].native}
                  </span>
                )}
                <span className="text-2xl leading-none">{e}</span>
                <span className="font-display leading-tight">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <Section
        eyebrow="The problem"
        title="Same child. Two very different boards."
        sub="Speech therapists have asked for culture-specific words since at least 2022. Today parents add them by hand, one picture at a time."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border-2 border-dashed border-[#d6d0c4] bg-white/40 p-6">
            <div className="mb-4 flex items-center gap-2 font-bold text-[var(--muted)]">
              <span className="rounded-full bg-[#ececec] px-2.5 py-1 text-xs">Before</span> A generic board
            </div>
            <div className="grid grid-cols-3 gap-3">
              {GENERIC.map((g) => (
                <div key={g.l} className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#dcdcdc] bg-[#f2f2f2] grayscale">
                  <span className="text-4xl">{g.e}</span>
                  <span className="font-bold text-[#6b6b6b]">{g.l}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[var(--muted)]">
              He can ask for <em>a</em> cookie. He can&apos;t ask for <em>his</em>.
            </p>
          </div>
          <div className="relative rounded-[2rem] border-2 border-[var(--accent)] bg-gradient-to-br from-[#f1fbf8] to-white p-6 shadow-[0_8px_0_var(--accent)]">
            <div className="mb-4 flex items-center gap-2 font-bold text-[var(--accent)]">
              <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs text-white">After</span> HomeTiles, built for Leo in London
            </div>
            <div className="grid grid-cols-3 gap-3">
              {HOME.map((g, k) => (
                <div key={g.l} className="kid-tile pop-in min-h-24" style={{ ...tileStyle(g.c), animationDelay: `${k * 80}ms` }}>
                  <span className="text-4xl leading-none">{g.e}</span>
                  <span className="font-display text-sm font-bold leading-tight">{g.l}</span>
                  {g.s && <span className="text-[10px] font-semibold opacity-70">{g.s}</span>}
                </div>
              ))}
            </div>
            <p className="mt-4 font-semibold">His snack, his playground, his cartoon, his grandma&apos;s songs.</p>
            <ul className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-3 text-sm text-[var(--muted)]" aria-label="Other demo children, in their family's language">
              {ELSEWHERE.map((x) => (
                <li key={x.who} className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold">
                    In {LANGUAGES[x.lang].english}, for {x.who}:
                  </span>
                  {x.words.map(([e, w]) => (
                    <span key={w} lang={x.lang} className="rounded-full bg-white px-2 py-0.5 font-display text-xs font-bold text-[var(--ink)] shadow-sm">
                      <span aria-hidden>{e} </span>
                      {w}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* JOURNEY */}
      <Section
        className="bg-gradient-to-b from-white/70 to-transparent"
        eyebrow="See every screen"
        title="From a few questions to a board that talks"
        sub="This is exactly what you'll see, step by step. Tap a step to look closer."
      >
        <Journey />
      </Section>

      {/* TWO BOARDS */}
      <Section eyebrow="Built for how children learn" title="Two boards, one child" sub="Core words like “I”, “want” and “stop” stay in the same place on both, so muscle memory works.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              e: "⭐",
              t: "For me: the smart board",
              d: "Learns on the device what the child says and when. After “I want” it shows their snacks and shows; in the evening, their cartoons. “Said before” repeats a whole sentence in one tap.",
              bg: "var(--brand-soft)",
              edge: "#f3b49c",
            },
            {
              e: "📁",
              t: "All words: the classic board",
              d: "Every word lives in a fixed folder: food, places, favourites, family, fun, “I need”. Nothing moves, which many therapists prefer while a child is learning.",
              bg: "#eaf1ff",
              edge: "#b8cbf2",
            },
            {
              e: "🔒",
              t: "A child lock",
              d: "“Give to Leo” goes full-screen and hides every menu. The back button is blocked. Parents exit by holding the lock for 2 seconds.",
              bg: "var(--accent-soft)",
              edge: "#9ed6ca",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-[2rem] border-2 p-6 transition-transform duration-300 hover:-translate-y-1" style={{ background: c.bg, borderColor: c.edge, boxShadow: `0 6px 0 ${c.edge}` }}>
              <div className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-white bg-white/70 text-3xl shadow-[0_4px_0_rgb(0_0_0/0.08)]">{c.e}</div>
              <h3 className="mt-4 text-2xl font-extrabold leading-tight">{c.t}</h3>
              <p className="mt-2 leading-relaxed text-[#3c3a48]">{c.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* QLOO */}
      <Section
        className="bg-white/60"
        eyebrow="Why Qloo"
        title="What an AI alone gets wrong, and Qloo gets right"
        sub="A chatbot can guess “kids like chocolate”. It can't know the playground 10 minutes from this child's home, or which songs he and his grandma would both love."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5 lg:col-span-2">
            <div aria-hidden className="mb-4 grid h-28 grid-cols-8 gap-1 rounded-2xl bg-[var(--surface-2)] p-2">
              {Array.from({ length: 24 }, (_, k) => {
                const v = [0.1, 0.2, 0.15, 0.4, 0.25, 0.1, 0.05, 0.1, 0.2, 0.6, 0.85, 0.5, 0.3, 0.15, 0.1, 0.2, 0.1, 0.35, 0.7, 1, 0.55, 0.2, 0.1, 0.05][k];
                return <span key={k} className="relative rounded-md" style={{ background: `rgb(226 87 43 / ${v})` }}>{k === 19 && <span className="absolute inset-0 grid place-items-center text-sm">🏠</span>}</span>;
              })}
            </div>
            <h3 className="text-xl font-extrabold">📍 Places near home</h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">A taste heatmap finds where this child&apos;s kind of taste clusters near home, then the real places inside those hot-spots.</p>
          </div>
          <div className="card p-5">
            <div aria-hidden className="relative mb-4 h-28">
              <span className="absolute left-4 top-3 h-20 w-20 rounded-full bg-[var(--brand)]/30" />
              <span className="absolute left-14 top-3 h-20 w-20 rounded-full bg-[var(--grape)]/30" />
              <span className="absolute left-[3.4rem] top-10 text-xl">🎵</span>
              <span className="absolute left-6 top-9 text-lg">👦</span>
              <span className="absolute left-24 top-9 text-lg">👵</span>
            </div>
            <h3 className="text-xl font-extrabold">🤝 Shared with grandparents</h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">Comparing the child&apos;s tastes with a grandparent&apos;s finds songs and films they&apos;d both enjoy.</p>
          </div>
          <div className="card p-5">
            <div aria-hidden className="mb-4 flex h-28 items-end gap-2 rounded-2xl bg-[var(--surface-2)] p-3">
              {[30, 52, 41, 68, 88].map((h, k) => (
                <span key={k} className="flex-1 rounded-t-lg bg-[var(--accent)]" style={{ height: `${h}%`, opacity: 0.4 + k * 0.15 }} />
              ))}
            </div>
            <h3 className="text-xl font-extrabold">📈 What&apos;s new</h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">Trending data adds the rising show everyone at school is talking about, so the child can join in.</p>
          </div>
        </div>
      </Section>

      {/* WHY */}
      <section className="bg-[#1d1b26] px-4 py-20 text-white">
        <div className="reveal mx-auto max-w-4xl text-center">
          <p className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">&ldquo;There&apos;s more to life than cookies.&rdquo;</p>
          <p className="mt-3 text-sm opacity-70">A mother, quoted by AAC researchers Light &amp; McNaughton (2014)</p>
          <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
            <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed">
              Families give up on AAC when <strong>it doesn&apos;t fit their life</strong> and there&apos;s little support (Johnson 2006; Moorcroft 2020).
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed">
              &ldquo;Doesn&apos;t fit and doesn&apos;t work for us&rdquo;: <strong>cultural and language mismatch</strong> came up in 8 of 11 parent studies (Gardiner 2025).
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed">
              Users say humour helps people <strong>&ldquo;see that I am a person&rdquo;</strong>. HomeTiles adds jokes and banter about their favourites (CHI 2025).
            </p>
          </div>
        </div>
      </section>

      {/* TRY */}
      <Section id="try" eyebrow="Try it now" title="Build a board in about a minute" sub="Watch the agent research a demo child live, in English, Hindi or Spanish. Or make one for your own child.">
        <div className="mx-auto max-w-5xl">
          <PersonaButtons />
          <Link
            href="/create"
            className="group mt-4 flex items-center gap-4 rounded-[2rem] border-2 border-dashed border-[var(--brand)] bg-white/60 p-5 transition-colors hover:bg-[var(--brand-soft)]"
          >
            <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--brand)] text-3xl text-white shadow-[0_4px_0_var(--brand-edge)] transition-transform group-hover:rotate-90">
              ＋
            </span>
            <span>
              <span className="font-display block text-2xl font-extrabold">Make a board for your own child</span>
              <span className="text-sm text-[var(--muted)]">Three quick steps. Names stay on this device; only Qloo IDs and the city go to Qloo.</span>
            </span>
            <span aria-hidden className="ml-auto hidden text-2xl transition-transform group-hover:translate-x-1 sm:block">
              →
            </span>
          </Link>
          <p className="mt-4 text-center text-xs text-[var(--muted)]">Demo children are fictional. HomeTiles supports speech-language therapists; it doesn&apos;t replace them.</p>
        </div>
      </Section>
    </div>
  );
}
