import Link from "next/link";
import { PersonaButtons } from "@/components/PersonaButtons";
import { HeroDemo } from "@/components/landing/HeroDemo";

const GENERIC = [
  { e: "🍪", l: "cookie" },
  { e: "🌳", l: "park" },
  { e: "📺", l: "cartoon" },
  { e: "🧃", l: "juice" },
  { e: "👩", l: "mom" },
  { e: "⚽", l: "ball" },
];
const HOME = [
  { e: "🍪", l: "Parle-G", c: "food" },
  { e: "🥟", l: "Sharma Ji Chaat · 300 m", c: "places" },
  { e: "📺", l: "Chhota Bheem", c: "favourites" },
  { e: "🧃", l: "Frooti", c: "food" },
  { e: "👴", l: "Dadu", c: "people" },
  { e: "🎵", l: "Rafi songs with Dadu", c: "together" },
];

const QLOO = [
  { e: "📍", t: "Places near home", d: "A taste heatmap finds where this child's kind of taste clusters near home, then the real places inside those hot-spots." },
  { e: "🤝", t: "Things to share with Dadu", d: "Comparing the child's tastes with a grandparent's finds songs and films they'd both enjoy. Conversation, not just requests." },
  { e: "👥", t: "Who loves this?", d: "Audience data sorts tiles into talking with cousins and friends versus talking with grandparents." },
  { e: "📈", t: "What's new", d: "Trending data adds the rising show everyone at school is talking about, so the child can join in." },
];

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="inline-block rounded-full bg-[#ffe7dc] px-3 py-1 text-sm font-bold text-[var(--brand)]">For children who can&apos;t speak (yet)</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] sm:text-6xl">
            A talking picture board that <span className="text-[var(--brand)]">sounds like home.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#3c4249]">
            Non-speaking children talk by tapping pictures. Most boards only know <em>&ldquo;cookie&rdquo;</em> and <em>&ldquo;park&rdquo;</em>.
            HomeTiles builds one in a minute with the <strong>snacks, shows, places and family a child actually knows</strong>.
            It learns what they say and puts the next word right where they need it.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#try" className="btn btn-primary px-6 py-3 text-lg">▶ See a demo board</a>
            <Link href="/create" className="btn px-6 py-3 text-lg">Make one for my child</Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[var(--muted)]">
            <li>🗣️ Speaks Hindi, Spanish and English</li>
            <li>🔒 Child lock</li>
            <li>📴 Taps stay on the device</li>
            <li>✅ Parents approve changes</li>
          </ul>
        </div>
        <HeroDemo />
      </section>

      {/* PROBLEM */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold">Same child. Two very different boards.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-[var(--muted)]">
            Speech therapists have been asking for boards with culture-specific words since at least 2022 (<a className="underline" href="https://github.com/cboard-org/cboard/issues/1267" target="_blank" rel="noreferrer">Cboard #1267</a>).
            Today parents add them by hand, one picture at a time.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border-2 border-dashed border-[#d6d0c4] p-5">
              <div className="mb-3 font-bold text-[var(--muted)]">A generic board</div>
              <div className="grid grid-cols-3 gap-2">
                {GENERIC.map((g) => (
                  <div key={g.l} className="kid-tile min-h-24 border-[#d9d9d9] bg-[#f2f2f2] grayscale">
                    <span className="text-4xl">{g.e}</span>
                    <span className="font-bold">{g.l}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">He can ask for <em>a</em> cookie. He can&apos;t ask for <em>his</em>.</p>
            </div>
            <div className="rounded-3xl border-2 border-[var(--accent)] bg-[#f3fbf9] p-5">
              <div className="mb-3 font-bold text-[var(--accent)]">HomeTiles, built for Aarav</div>
              <div className="grid grid-cols-3 gap-2">
                {HOME.map((g) => (
                  <div key={g.l} className="kid-tile min-h-24" style={{ background: `var(--c-${g.c})`, borderColor: `var(--b-${g.c})` }}>
                    <span className="text-4xl">{g.e}</span>
                    <span className="text-sm font-bold leading-tight">{g.l}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm">His snack, his chaat stall, his cartoon, his grandfather&apos;s songs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TWO BOARDS */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-3xl font-extrabold">Two boards, one child</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[var(--muted)]">Core words like &ldquo;I&rdquo;, &ldquo;want&rdquo; and &ldquo;stop&rdquo; stay in the same place on both, so muscle memory works.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-[#fff1ea] p-6">
            <div className="text-4xl">⭐</div>
            <h3 className="mt-2 text-xl font-extrabold">For me: the smart board</h3>
            <p className="mt-2 leading-relaxed">
              Learns on the device what the child says and when. After &ldquo;I want&rdquo; it shows their snacks and shows. In the evening it brings up their cartoons.
              <strong> No digging through folders.</strong> &ldquo;Said before&rdquo; repeats a whole sentence in one tap.
            </p>
          </div>
          <div className="rounded-3xl bg-[#eef3ff] p-6">
            <div className="text-4xl">📁</div>
            <h3 className="mt-2 text-xl font-extrabold">All words: the classic board</h3>
            <p className="mt-2 leading-relaxed">
              Every word lives in a fixed folder: food, places, favourites, family, fun, &ldquo;I need&rdquo;. Nothing moves, which is what many therapists prefer while a child is learning.
            </p>
          </div>
          <div className="rounded-3xl bg-[#f1f7ee] p-6">
            <div className="text-4xl">🔒</div>
            <h3 className="mt-2 text-xl font-extrabold">A child lock</h3>
            <p className="mt-2 leading-relaxed">
              &ldquo;Give to Aarav&rdquo; goes full-screen and hides every menu. The back button is blocked. Parents exit by holding the lock for 2 seconds, which a quick tap can&apos;t do.
            </p>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold">Ready in about a minute</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["1", "Tell us a little", "Neighbourhood, home language, and 3–5 things they love: a cartoon, a game, a snack, a singer."],
              ["2", "The AI agent does the research", "It asks Qloo's taste graph for related favourites, real places near home, local snacks, and things to share with grandparents. Every tile shows why it's there."],
              ["3", "Tap, talk, grow", "The board speaks both languages. Each week it suggests new tiles from what was actually tapped. You approve every change."],
            ].map(([n, t, d]) => (
              <li key={n} className="rounded-3xl border border-[var(--line)] p-6">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand)] text-lg font-extrabold text-white">{n}</div>
                <h3 className="mt-3 text-lg font-extrabold">{t}</h3>
                <p className="mt-1 leading-relaxed text-[var(--muted)]">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* QLOO */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-3xl font-extrabold">What an AI alone gets wrong, and Qloo gets right</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[var(--muted)]">
          A chatbot can guess &ldquo;Indian kids like samosa&rdquo;. It can&apos;t know the chaat stall 300 m from this child&apos;s home, or which songs he and his grandfather would both love.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QLOO.map((q) => (
            <div key={q.t} className="rounded-3xl border border-[var(--line)] bg-white p-5">
              <div className="text-3xl">{q.e}</div>
              <h3 className="mt-2 font-extrabold">{q.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{q.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="bg-[#1f2328] py-14 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-3xl font-extrabold leading-snug sm:text-4xl">&ldquo;There&apos;s more to life than cookies.&rdquo;</p>
          <p className="mt-2 text-sm opacity-70">A mother, quoted by AAC researchers Light &amp; McNaughton (2014)</p>
          <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
            <p className="rounded-2xl bg-white/10 p-4 text-sm leading-relaxed">Families give up on AAC when <strong>it doesn&apos;t fit their life</strong> and there&apos;s little support (Johnson 2006; Moorcroft 2020).</p>
            <p className="rounded-2xl bg-white/10 p-4 text-sm leading-relaxed">&ldquo;Doesn&apos;t fit and doesn&apos;t work for us&rdquo;: <strong>cultural and language mismatch</strong> came up in 8 of 11 parent studies (Gardiner 2025).</p>
            <p className="rounded-2xl bg-white/10 p-4 text-sm leading-relaxed">Users say humour helps people <strong>&ldquo;see that I am a person&rdquo;</strong>. HomeTiles adds jokes and banter about their favourites (CHI 2025).</p>
          </div>
        </div>
      </section>

      {/* TRY */}
      <section id="try" className="mx-auto max-w-4xl scroll-mt-6 px-4 py-14">
        <h2 className="text-center text-3xl font-extrabold">Try it with a demo child</h2>
        <p className="mt-2 text-center text-[var(--muted)]">The agent builds the board live. Then press &ldquo;Give to …&rdquo; to see child mode.</p>
        <div className="mt-6">
          <PersonaButtons />
        </div>
        <p className="mt-3 text-center text-xs text-[var(--muted)]">Demo children are fictional. HomeTiles supports speech-language therapists; it doesn&apos;t replace them.</p>
      </section>
    </div>
  );
}
