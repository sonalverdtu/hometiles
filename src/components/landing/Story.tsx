// "Why we made this": the short, true story behind HomeTiles. Only facts the team gave us; no invented details.

import type { CSSProperties } from "react";

const tile = (c: string): CSSProperties => ({ background: `var(--c-${c})`, ["--edge" as string]: `var(--b-${c})` });

export function Story() {
  return (
    <section aria-labelledby="story-title" className="px-4 py-16 sm:py-20">
      <div className="reveal mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand)]">Why we made this</p>
          <h2 id="story-title" className="mt-2 text-3xl font-extrabold leading-tight sm:text-5xl">
            It started with our little cousin.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#3c3a48]">
            When she was little, our cousin used a picture board to talk. It had the everyday words, but not <em>hers</em>: her snacks, her cartoons, the names of her family.
            Adding them was tricky, so mostly they just weren&apos;t there.
          </p>
          <blockquote className="font-display mt-6 border-l-4 border-[var(--brand)] pl-4 text-2xl font-extrabold leading-snug sm:text-3xl">
            She could tap. The board just didn&apos;t have her words.
          </blockquote>
          <p className="mt-6 text-lg leading-relaxed">
            So we built <strong>HomeTiles</strong>: a board that starts from the words in a child&apos;s own life, and adds them for the family in about a minute.
          </p>
        </div>

        {/* A picture of the problem: everyday tiles, and empty slots where her own words should be. */}
        <div aria-hidden className="relative mx-auto w-full max-w-sm">
          <div className="blob -inset-4 bg-[#ffd0bd]" />
          <div className="card relative p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Her picture board</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["🍪", "cookie"],
                ["🌳", "park"],
                ["⚽", "ball"],
              ].map(([e, l]) => (
                <div key={l} className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#dcdcdc] bg-[#f2f2f2] grayscale">
                  <span className="text-3xl">{e}</span>
                  <span className="font-bold text-[#6b6b6b]">{l}</span>
                </div>
              ))}
              {[
                ["her snack", "food"],
                ["her cartoon", "favourites"],
                ["her family", "people"],
              ].map(([l, c]) => (
                <div key={l} className="story-missing flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed p-1 text-center" style={{ borderColor: `var(--b-${c})` }}>
                  <span className="font-display text-3xl font-extrabold" style={{ color: `var(--b-${c})` }}>
                    ?
                  </span>
                  <span className="text-xs font-bold text-[var(--muted)]">{l}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--surface-2)] p-2.5 text-sm">
              <span className="text-xl">✨</span>
              <span className="font-semibold">HomeTiles adds them</span>
              <span className="ml-auto flex gap-1.5">
                {[
                  ["🍫", "food"],
                  ["📺", "favourites"],
                  ["👵", "people"],
                ].map(([e, c]) => (
                  <span key={c} className="kid-tile h-9 w-9 rounded-xl p-0 text-lg" style={tile(c)}>
                    {e}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
