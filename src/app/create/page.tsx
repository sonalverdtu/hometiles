"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { EntityRef, Lang, Profile } from "@/lib/board/types";
import type { AgeBand, QlooType } from "@/lib/qloo/types";
import { setPendingProfile } from "@/lib/client/store";

const TYPES: { id: QlooType; label: string; emoji: string; example: string; cat: string }[] = [
  { id: "urn:entity:tv_show", label: "Cartoon / show", emoji: "📺", example: "e.g. Chhota Bheem", cat: "favourites" },
  { id: "urn:entity:videogame", label: "Game", emoji: "🎮", example: "e.g. Minecraft", cat: "favourites" },
  { id: "urn:entity:brand", label: "Snack / drink", emoji: "🍪", example: "e.g. Parle-G", cat: "food" },
  { id: "urn:entity:artist", label: "Singer / music", emoji: "🎵", example: "e.g. Arijit Singh", cat: "together" },
  { id: "urn:entity:movie", label: "Movie", emoji: "🎬", example: "e.g. Encanto", cat: "favourites" },
  { id: "urn:entity:place", label: "Place to eat", emoji: "📍", example: "e.g. their favourite chaat stall", cat: "places" },
];

const AGES: { id: AgeBand; label: string; child?: boolean }[] = [
  { id: "24_and_younger", label: "Child (under 13)", child: true },
  { id: "24_and_younger", label: "Teen (13–19)" },
  { id: "24_and_younger", label: "20–24" },
  { id: "25_to_29", label: "25–29" },
  { id: "30_to_34", label: "30–34" },
  { id: "35_to_44", label: "35–44" },
  { id: "45_to_54", label: "45–54" },
  { id: "55_and_older", label: "55+" },
];

const LANGS: { id: Lang; label: string }[] = [
  { id: "hi", label: "हिंदी Hindi" },
  { id: "es", label: "Español" },
  { id: "en", label: "English" },
];

const CORE_PREVIEW: Record<Lang, [string, string][]> = {
  hi: [["🙋", "मैं"], ["🤲", "चाहिए"], ["🚶", "चलो"], ["🆘", "मदद"]],
  es: [["🙋", "Yo"], ["🤲", "quiero"], ["🚶", "vamos"], ["🆘", "ayuda"]],
  en: [["🙋", "I"], ["🤲", "want"], ["🚶", "go"], ["🆘", "help"]],
};

const RELATIONS = ["mother", "father", "grandmother", "grandfather", "sister", "brother", "aunt", "uncle", "friend", "carer"];
const STEPS = [
  { title: "About them", icon: "👋" },
  { title: "What they love", icon: "💜" },
  { title: "Family", icon: "👪" },
];

interface Fav extends EntityRef {
  key: number;
}

function FavSearch({ type, onAdd }: { type: (typeof TYPES)[number]; onAdd: (e: EntityRef) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<EntityRef[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) return;
    timer.current = setTimeout(async () => {
      setBusy(true);
      const res = await fetch("/api/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q.trim(), types: [type.id] }) }).catch(() => null);
      const j = res ? await res.json().catch(() => ({ results: [] })) : { results: [] };
      setHits(j.results ?? []);
      setBusy(false);
    }, 300);
  }, [q, type.id]);

  const add = (e: EntityRef) => {
    onAdd(e);
    setQ("");
    setHits([]);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl">{type.emoji}</span>
          <input
            className="input pl-11"
            placeholder={type.example}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (e.target.value.trim().length < 2) setHits([]);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (q.trim()) add(hits[0] ?? { name: q.trim(), type: type.id });
              }
              if (e.key === "Escape") setHits([]);
            }}
            aria-label={`Add a ${type.label}`}
          />
          {busy && <span aria-hidden className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />}
        </div>
        <button type="button" className="btn btn-primary px-5" disabled={!q.trim()} onClick={() => add(hits[0] ?? { name: q.trim(), type: type.id })}>
          Add
        </button>
      </div>
      {hits.length > 0 && (
        <ul className="fade-up absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-md)]">
          {hits.map((h) => (
            <li key={h.qlooId ?? h.name}>
              <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left font-semibold hover:bg-[var(--surface-2)]" onClick={() => add(h)}>
                <span aria-hidden className="text-xl">{type.emoji}</span> {h.name}
                <span className="ml-auto rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-bold text-[var(--accent)]">✓ in Qloo</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChipGroup<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; t: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={String(o.v)} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)} className="chip">
            {o.t}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [ageIdx, setAgeIdx] = useState(0);
  const [city, setCity] = useState("");
  const [home, setHome] = useState<{ lat: number; lon: number } | undefined>();
  const [primary, setPrimary] = useState<Lang>("hi");
  const [secondary, setSecondary] = useState<Lang | "">("en");
  const [type, setType] = useState(TYPES[0]);
  const [favs, setFavs] = useState<Fav[]>([]);
  const [family, setFamily] = useState<{ name: string; relation: string; singers: string }[]>([{ name: "", relation: "mother", singers: "" }]);
  const [err, setErr] = useState<string | null>(null);
  const key = useRef(1);

  const step1Ok = name.trim().length > 0 && city.trim().length >= 2;
  const step2Ok = favs.length > 0;
  const who = name.trim() || "your child";

  function next() {
    setErr(null);
    if (step === 1 && !step1Ok) return setErr("Please add a first name and a neighbourhood or city.");
    if (step === 2 && !step2Ok) return setErr("Add at least one thing they love. 3–5 works best.");
    setStep((s) => s + 1);
  }

  function build() {
    const age = AGES[ageIdx];
    const profile: Profile = {
      id: `p-${Date.now().toString(36)}`,
      displayName: name.trim(),
      ageBand: age.id,
      isChild: !!age.child,
      city: city.trim(),
      home,
      primaryLang: primary,
      secondaryLang: secondary && secondary !== primary ? secondary : undefined,
      loves: favs.map(({ key: _k, ...f }) => f),
      family: family
        .filter((f) => f.name.trim())
        .map((f) => ({
          name: f.name.trim(),
          relation: f.relation,
          loves: f.singers
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 4)
            .map((n) => ({ name: n, type: "urn:entity:artist" as QlooType })),
        })),
    };
    setPendingProfile(profile);
    router.push("/generate");
  }

  const people = family.filter((f) => f.name.trim());

  return (
    <div className="relative overflow-x-clip">
      <div aria-hidden className="blob -left-20 top-0 h-72 w-72 bg-[#ffb48f]" />
      <div aria-hidden className="blob -right-20 top-60 h-72 w-72 bg-[#c9b8ff]" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand)]">New board</p>
          <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl">Make a board for {name.trim() ? name.trim() : "a child"}</h1>
          <p className="mt-2 text-[var(--muted)]">Three quick steps. Names stay on this device; only Qloo IDs and the city are sent to Qloo.</p>

          {/* Stepper */}
          <ol className="relative mt-7 grid grid-cols-3" aria-label="Progress">
            <span aria-hidden className="absolute left-[16.6%] right-[16.6%] top-6 h-1.5 rounded-full bg-[var(--line)]" />
            <span aria-hidden className="absolute left-[16.6%] top-6 h-1.5 rounded-full bg-[var(--brand)] transition-all duration-500" style={{ width: `${((step - 1) / 2) * 66.8}%` }} />
            {STEPS.map((s, i) => {
              const n = i + 1;
              const state = step === n ? "now" : step > n ? "done" : "todo";
              return (
                <li key={s.title} className="relative flex flex-col items-center gap-1.5 text-center" aria-current={state === "now" ? "step" : undefined}>
                  <span
                    className={`grid h-[3.2rem] w-[3.2rem] place-items-center rounded-2xl border-2 text-2xl transition-all duration-300 ${
                      state === "now" ? "scale-110 border-[var(--brand)] bg-white shadow-[0_4px_0_var(--brand)]" : state === "done" ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_4px_0_#08473f]" : "border-[var(--line)] bg-white shadow-[0_4px_0_var(--line)]"
                    }`}
                  >
                    {state === "done" ? "✓" : s.icon}
                  </span>
                  <span className={`text-xs font-bold sm:text-sm ${state === "todo" ? "text-[var(--muted)]" : ""}`}>{s.title}</span>
                </li>
              );
            })}
          </ol>

          <div className="card mt-6 p-5 sm:p-7">
            <div key={step} className="fade-up">
              {step === 1 && (
                <div className="grid gap-5">
                  <label className="grid gap-1.5 text-sm font-bold">
                    Their first name
                    <input className="input text-lg" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="e.g. Aarav" autoFocus />
                    <span className="text-xs font-normal text-[var(--muted)]">🔒 Stays on this device.</span>
                  </label>
                  <ChipGroup label="Age" value={ageIdx} onChange={setAgeIdx} options={AGES.map((a, i) => ({ v: i, t: a.label }))} />
                  <div className="grid gap-2">
                    <label className="grid gap-1.5 text-sm font-bold">
                      Neighbourhood and city
                      <input className="input" placeholder="e.g. Rajouri Garden, New Delhi" value={city} onChange={(e) => setCity(e.target.value)} maxLength={120} />
                    </label>
                    <button
                      type="button"
                      className={`btn w-fit ${home ? "btn-accent" : ""}`}
                      onClick={() =>
                        navigator.geolocation?.getCurrentPosition(
                          (p) => setHome({ lat: Math.round(p.coords.latitude * 1000) / 1000, lon: Math.round(p.coords.longitude * 1000) / 1000 }),
                          () => setErr("Couldn't get your location. The neighbourhood name works fine."),
                        )
                      }
                    >
                      📍 {home ? "Home location set (rounded to about 100 m)" : "Use my location for places near home (optional)"}
                    </button>
                  </div>
                  <ChipGroup label="Language at home" value={primary} onChange={setPrimary} options={LANGS.map((l) => ({ v: l.id, t: l.label }))} />
                  <ChipGroup
                    label="Second language"
                    value={secondary}
                    onChange={setSecondary}
                    options={[{ v: "" as const, t: "None" }, ...LANGS.filter((l) => l.id !== primary).map((l) => ({ v: l.id, t: l.label }))]}
                  />
                </div>
              )}

              {step === 2 && (
                <div>
                  <p className="font-display text-2xl font-extrabold">What does {who} love?</p>
                  <p className="mb-4 text-sm text-[var(--muted)]">Pick a kind, then type. Add 3–5 things: they seed everything the agent finds.</p>
                  <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Kind of thing">
                    {TYPES.map((t) => (
                      <button key={t.id} type="button" role="radio" aria-checked={type.id === t.id} onClick={() => setType(t)} className="chip">
                        <span aria-hidden className="text-lg">{t.emoji}</span> {t.label}
                      </button>
                    ))}
                  </div>
                  <FavSearch type={type} onAdd={(e) => setFavs((f) => (f.length >= 8 || f.some((x) => x.name === e.name) ? f : [...f, { ...e, key: key.current++ }]))} />
                  <div className="mt-5 grid min-h-28 grid-cols-2 gap-3 sm:grid-cols-4">
                    {favs.length === 0 && (
                      <div className="col-span-full grid place-items-center rounded-2xl border-2 border-dashed border-[var(--line)] p-6 text-sm text-[var(--muted)]">Nothing added yet. Their favourites will appear here as tiles.</div>
                    )}
                    {favs.map((f) => {
                      const t = TYPES.find((x) => x.id === f.type) ?? TYPES[0];
                      return (
                        <div key={f.key} className="kid-tile pop-in min-h-24" style={{ background: `var(--c-${t.cat})`, ["--edge" as string]: `var(--b-${t.cat})` }}>
                          <span aria-hidden className="text-3xl leading-none">{t.emoji}</span>
                          <span className="font-display line-clamp-2 text-sm font-bold leading-tight">{f.name}</span>
                          {f.qlooId ? <span className="text-[10px] font-bold text-[var(--accent)]">✓ in Qloo</span> : <span className="text-[10px] text-[var(--muted)]">checked at build</span>}
                          <button
                            type="button"
                            aria-label={`Remove ${f.name}`}
                            className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[var(--ink)] text-xs text-white shadow"
                            onClick={() => setFavs((x) => x.filter((y) => y.key !== f.key))}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    {favs.length}/5 added · ✓ means Qloo knows it. Unmatched names are searched again when the board is built.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div>
                  <p className="font-display text-2xl font-extrabold">Who&apos;s at home?</p>
                  <p className="mb-4 text-sm text-[var(--muted)]">They become “My people” tiles. Add a grandparent&apos;s favourite singers and the agent finds things they can enjoy together.</p>
                  <div className="space-y-3">
                    {family.map((f, i) => (
                      <div key={i} className="pop-in grid gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3 sm:grid-cols-[1fr_1fr_auto]">
                        <input aria-label="Name" placeholder="Name, e.g. Dadu" className="input" value={f.name} onChange={(e) => setFamily((fs) => fs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                        <select aria-label="Relation" className="input" value={f.relation} onChange={(e) => setFamily((fs) => fs.map((x, j) => (j === i ? { ...x, relation: e.target.value } : x)))}>
                          {RELATIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="btn h-12 w-12 p-0" aria-label="Remove" onClick={() => setFamily((fs) => fs.filter((_, j) => j !== i))}>
                          ✕
                        </button>
                        <input
                          aria-label="Their favourite singers"
                          placeholder="🎵 Their favourite singers (optional), e.g. Mohammed Rafi"
                          className="input sm:col-span-3"
                          value={f.singers}
                          onChange={(e) => setFamily((fs) => fs.map((x, j) => (j === i ? { ...x, singers: e.target.value } : x)))}
                        />
                      </div>
                    ))}
                  </div>
                  {family.length < 6 && (
                    <button type="button" className="btn mt-3" onClick={() => setFamily((fs) => [...fs, { name: "", relation: "grandfather", singers: "" }])}>
                      ＋ Add someone
                    </button>
                  )}
                </div>
              )}
            </div>

            {err && (
              <p role="alert" className="fade-up mt-5 rounded-2xl border-2 border-[#f3b0a0] bg-[#fff1ec] p-3 text-sm font-semibold">
                {err}
              </p>
            )}

            <div className="mt-7 flex items-center gap-2 border-t border-[var(--line)] pt-5">
              {step > 1 && (
                <button type="button" className="btn btn-lg" onClick={() => setStep((s) => s - 1)}>
                  ← Back
                </button>
              )}
              {step < 3 ? (
                <button type="button" className="btn btn-primary btn-lg ml-auto" onClick={next}>
                  Next →
                </button>
              ) : (
                <button type="button" className="btn btn-primary btn-lg ml-auto" onClick={build}>
                  ✨ Build {name.trim() ? `${name.trim()}'s` : "the"} board
                </button>
              )}
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-[var(--muted)]">Please don&apos;t enter medical details. HomeTiles supports speech therapists; it doesn&apos;t replace them.</p>
        </div>

        {/* Live preview of the board being made */}
        <aside className="hidden lg:block" aria-label="Preview">
          <div className="sticky top-24">
            <p className="mb-3 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--muted)]">Live preview</p>
            <div className="phone">
              <div className="phone-screen min-h-[560px] p-3">
                <div aria-hidden className="mx-auto mb-3 h-5 w-24 rounded-full bg-[#15141b]" />
                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                  <span className="font-display grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#ec6233] to-[#6d4fe0] text-2xl font-extrabold text-white">
                    {(name.trim()[0] ?? "?").toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="font-display block truncate text-lg font-extrabold leading-tight">{name.trim() ? `${name.trim()}'s board` : "Your child's board"}</span>
                    <span className="block truncate text-xs text-[var(--muted)]">
                      {city.trim() || "Neighbourhood"} · {LANGS.find((l) => l.id === primary)?.label}
                      {secondary ? ` + ${LANGS.find((l) => l.id === secondary)?.label}` : ""}
                    </span>
                  </span>
                </div>
                <div className="mb-3 grid grid-cols-4 gap-1.5">
                  {CORE_PREVIEW[primary].map(([e, l], k) => (
                    <div key={l} className="kid-tile min-h-[3.6rem] p-1" style={{ background: `var(--c-${k === 3 ? "safety" : "core"})`, ["--edge" as string]: `var(--b-${k === 3 ? "safety" : "core"})` }}>
                      <span className="text-lg leading-none">{e}</span>
                      <span className="font-display text-xs font-bold">{l}</span>
                    </div>
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-bold text-[var(--muted)]">💜 Favourites</p>
                <div className="mb-3 grid grid-cols-3 gap-1.5">
                  {favs.slice(0, 6).map((f) => {
                    const t = TYPES.find((x) => x.id === f.type) ?? TYPES[0];
                    return (
                      <div key={f.key} className="kid-tile pop-in min-h-[4.2rem] p-1" style={{ background: `var(--c-${t.cat})`, ["--edge" as string]: `var(--b-${t.cat})` }}>
                        <span className="text-xl leading-none">{t.emoji}</span>
                        <span className="font-display line-clamp-2 text-[11px] font-bold leading-tight">{f.name}</span>
                      </div>
                    );
                  })}
                  {Array.from({ length: Math.max(0, 3 - favs.length) }, (_, k) => (
                    <div key={`e${k}`} className="shimmer min-h-[4.2rem] rounded-[1.25rem]" />
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-bold text-[var(--muted)]">👪 My people</p>
                <div className="mb-3 grid grid-cols-3 gap-1.5">
                  {people.slice(0, 3).map((f, k) => (
                    <div key={k} className="kid-tile pop-in min-h-[4.2rem] p-1" style={{ background: "var(--c-people)", ["--edge" as string]: "var(--b-people)" }}>
                      <span className="text-xl leading-none">{/grand/.test(f.relation) ? (f.relation.includes("mother") ? "👵" : "👴") : "🧑"}</span>
                      <span className="font-display text-[11px] font-bold">{f.name}</span>
                    </div>
                  ))}
                  {people.length === 0 && <div className="shimmer col-span-3 min-h-[4.2rem] rounded-[1.25rem]" />}
                </div>
                <p className="rounded-xl bg-white/70 p-2.5 text-center text-[11px] leading-snug text-[var(--muted)]">
                  ✨ Then the agent adds local snacks, places near home and things to share, all from Qloo.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
