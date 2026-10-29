import Link from "next/link";
import { PersonaButtons } from "@/components/PersonaButtons";

const STEPS = [
  { emoji: "📝", title: "Tell us a little", text: "Where they live, their family's language, and 3–5 things they love." },
  { emoji: "🧭", title: "The agent researches", text: "It uses Qloo's taste graph to find related favourites, real places near home, local snacks, and things to share with grandparents." },
  { emoji: "🗣️", title: "Tap, speak, grow", text: "The board speaks in both languages, learns from taps on the device, and suggests weekly updates that a parent approves." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">AAC boards that sound like home</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
            &ldquo;There&apos;s more to life than cookies.&rdquo;
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">A mother, quoted by AAC researchers Light &amp; McNaughton (2014)</p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed">
            Non-speaking people talk by tapping picture tiles. Most boards are generic: a child in Delhi can say
            &ldquo;cookie&rdquo; but not <em>Parle-G</em>, their favourite cartoon, or the chaat stall near home.
            <strong> HomeTiles builds a board around one real person</strong>, from their own culture, places and favourite things.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/create" className="btn btn-primary text-base">Create a board</Link>
            <Link href="/board" className="btn text-base">Open my last board</Link>
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">Try it in one click</h2>
          <PersonaButtons />
          <p className="mt-3 text-xs text-[var(--muted)]">Personas are fictional. No real child&apos;s data is used.</p>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <div aria-hidden className="text-3xl">{s.emoji}</div>
            <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-[var(--muted)]">{s.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="text-xl font-bold">Why this matters</h2>
        <ul className="mt-3 grid gap-2 text-[15px] leading-relaxed md:grid-cols-2">
          <li>• Families give up on AAC when the system <strong>doesn&apos;t fit their life</strong> and there&apos;s little support (Johnson 2006; Moorcroft 2020).</li>
          <li>• Updating vocabulary by hand is an <strong>extra burden on busy parents</strong> (Gardiner 2025 review).</li>
          <li>• &ldquo;Doesn&apos;t fit and doesn&apos;t work for us&rdquo;: <strong>cultural and language mismatch</strong> came up in 8 of 11 parent studies.</li>
          <li>• Speech therapists asked the open-source AAC app Cboard for <strong>culture-specific tiles</strong> (<a className="underline" href="https://github.com/cboard-org/cboard/issues/1267" target="_blank" rel="noreferrer">issue #1267</a>, open since 2022).</li>
        </ul>
      </section>
    </div>
  );
}
