import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { PersonaButtons } from "@/components/PersonaButtons";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { Journey } from "@/components/landing/Journey";
import { Story } from "@/components/landing/Story";
import { AiVsQloo } from "@/components/landing/AiVsQloo";
import { Architecture } from "@/components/landing/Architecture";
import { LANGUAGES, type Lang } from "@/lib/i18n";

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

function Section({
  id,
  eyebrow,
  title,
  sub,
  children,
  className = "",
  reveal = true,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  sub?: string;
  children: ReactNode;
  className?: string;
  /** Rise in on scroll. Off for sections that pin to the screen, since a scroll animation on a tall block would fade it mid-way. */
  reveal?: boolean;
}) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 py-16 sm:py-20 ${className}`}>
      <div className={`${reveal ? "reveal " : ""}mx-auto max-w-6xl`}>
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
              <strong>Every child deserves to say what they love.</strong> HomeTiles gives non-speaking children a talking picture board built from their own snacks, shows, places and family, by
              an AI agent using Qloo.
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

      {/* WHY WE MADE THIS */}
      <Story />

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

      {/* PROBLEM: pins to the screen; scrolling flips each AI guess into the Qloo pick (heading inside the frame) */}
      <section className="px-4 pb-14 pt-6">
        <AiVsQloo />
        <ul className="mx-auto mt-2 flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[var(--muted)]" aria-label="Other demo children, in their family's language">
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
      </section>

      {/* JOURNEY: pins to the screen; scrolling walks through the steps (heading inside the frame) */}
      <section className="bg-gradient-to-b from-white/70 to-transparent px-4 py-6">
        <Journey
          head={{
            eyebrow: "See every screen",
            title: "From a few questions to a board that talks",
            sub: "This is exactly what you'll see. Keep scrolling to move through each screen, or tap a step.",
          }}
        />
      </section>

      {/* TWO BOARDS */}
      <Section eyebrow="Built for how children learn" title="Two boards, one child" sub="Core words like “I”, “want” and “stop” stay in the same place on both, so muscle memory works.">
        <div className="grid gap-4 md:grid-cols-2">
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
          ].map((c) => (
            <div key={c.t} className="rounded-[2rem] border-2 p-6 transition-transform duration-300 hover:-translate-y-1" style={{ background: c.bg, borderColor: c.edge, boxShadow: `0 6px 0 ${c.edge}` }}>
              <div className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-white bg-white/70 text-3xl shadow-[0_4px_0_rgb(0_0_0/0.08)]">{c.e}</div>
              <h3 className="mt-4 text-2xl font-extrabold leading-tight">{c.t}</h3>
              <p className="mt-2 leading-relaxed text-[#3c3a48]">{c.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col items-start gap-3 rounded-[1.5rem] border-2 border-[#9ed6ca] bg-[var(--accent-soft)] px-5 py-4 sm:flex-row sm:items-center">
          <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-white bg-white/70 text-2xl shadow-[0_3px_0_rgb(0_0_0/0.08)]">
            🔒
          </span>
          <p className="leading-relaxed text-[#3c3a48]">
            <strong className="text-[var(--ink)]">Either board, safely in their hands.</strong> “Give to Leo” goes full-screen and hides every menu; the back button is blocked. Parents exit by holding the lock for 2 seconds.
          </p>
        </div>
      </Section>

      {/* UNDER THE HOOD: the architecture, stage by stage as you scroll */}
      <Section
        className="bg-white/60"
        eyebrow="Under the hood"
        title="How HomeTiles uses Qloo"
        sub="Follow one board from a parent's form to a child's hand. Scroll, and each stage switches on."
        reveal={false}
      >
        <Architecture />
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
              <span className="text-sm text-[var(--muted)]">Three quick steps. Names never go to the AI or to Qloo; only favourites, the city and age do.</span>
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
