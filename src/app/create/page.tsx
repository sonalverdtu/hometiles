"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { EntityRef, Lang, Profile } from "@/lib/board/types";
import type { AgeBand, QlooType } from "@/lib/qloo/types";
import { setPendingProfile } from "@/lib/client/store";

const TYPES: { id: QlooType; label: string; emoji: string; example: string }[] = [
  { id: "urn:entity:tv_show", label: "Cartoon / show", emoji: "📺", example: "e.g. Chhota Bheem" },
  { id: "urn:entity:videogame", label: "Game", emoji: "🎮", example: "e.g. Minecraft" },
  { id: "urn:entity:brand", label: "Snack / drink", emoji: "🍪", example: "e.g. Parle-G" },
  { id: "urn:entity:artist", label: "Singer / music", emoji: "🎵", example: "e.g. Arijit Singh" },
  { id: "urn:entity:movie", label: "Movie", emoji: "🎬", example: "e.g. Encanto" },
  { id: "urn:entity:place", label: "Place to eat", emoji: "📍", example: "e.g. their favourite chaat stall" },
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

const RELATIONS = ["mother", "father", "grandmother", "grandfather", "sister", "brother", "aunt", "uncle", "friend", "carer"];

interface Fav extends EntityRef {
  key: number;
}

function FavSearch({ type, onAdd }: { type: (typeof TYPES)[number]; onAdd: (e: EntityRef) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<EntityRef[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const res = await fetch("/api/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q.trim(), types: [type.id] }) }).catch(() => null);
      const j = res ? await res.json().catch(() => ({ results: [] })) : { results: [] };
      setHits(j.results ?? []);
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
        <input
          className="min-w-0 flex-1 rounded-xl border-2 border-[var(--line)] px-3 py-3 text-base"
          placeholder={type.example}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (q.trim()) add(hits[0] ?? { name: q.trim(), type: type.id });
            }
          }}
          aria-label={`Add a ${type.label}`}
        />
        <button type="button" className="btn btn-primary px-4" disabled={!q.trim()} onClick={() => add(hits[0] ?? { name: q.trim(), type: type.id })}>
          Add
        </button>
      </div>
      {hits.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-lg">
          {hits.map((h) => (
            <li key={h.qlooId}>
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[#fff4e8]" onClick={() => add(h)}>
                <span aria-hidden>{type.emoji}</span> {h.name}
                <span className="ml-auto text-xs font-semibold text-emerald-700">✓ in Qloo</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
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

  const STEPS = ["About them", "What they love", "Family"];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Make a board</h1>
      <p className="mt-1 text-[var(--muted)]">Three quick steps. Only Qloo IDs and the city are sent to Qloo, never names.</p>

      <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={`rounded-xl px-3 py-2 text-sm font-bold ${step === i + 1 ? "bg-[var(--brand)] text-white" : step > i + 1 ? "bg-[#dff3e4] text-emerald-900" : "bg-[#efe9df] text-[var(--muted)]"}`}>
            {step > i + 1 ? "✓" : i + 1}. {s}
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
        {step === 1 && (
          <div className="grid gap-4">
            <label className="grid gap-1 text-sm font-bold">
              Their first name
              <input className="rounded-xl border-2 border-[var(--line)] px-3 py-3 text-base font-normal" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="e.g. Aarav" />
              <span className="text-xs font-normal text-[var(--muted)]">Stays on this device.</span>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Age
              <select className="rounded-xl border-2 border-[var(--line)] px-3 py-3 text-base font-normal" value={ageIdx} onChange={(e) => setAgeIdx(Number(e.target.value))}>
                {AGES.map((a, i) => (
                  <option key={a.label} value={i}>{a.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Neighbourhood and city
              <input className="rounded-xl border-2 border-[var(--line)] px-3 py-3 text-base font-normal" placeholder="e.g. Rajouri Garden, New Delhi" value={city} onChange={(e) => setCity(e.target.value)} maxLength={120} />
            </label>
            <button
              type="button"
              className="btn w-fit"
              onClick={() =>
                navigator.geolocation?.getCurrentPosition(
                  (p) => setHome({ lat: Math.round(p.coords.latitude * 1000) / 1000, lon: Math.round(p.coords.longitude * 1000) / 1000 }),
                  () => setErr("Couldn't get your location. The neighbourhood name works fine."),
                )
              }
            >
              📍 {home ? "Home location set (rounded to about 100 m)" : "Use my location for places near home (optional)"}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-bold">
                Language at home
                <select className="rounded-xl border-2 border-[var(--line)] px-3 py-3 text-base font-normal" value={primary} onChange={(e) => setPrimary(e.target.value as Lang)}>
                  <option value="hi">हिंदी Hindi</option>
                  <option value="es">Español Spanish</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Second language
                <select className="rounded-xl border-2 border-[var(--line)] px-3 py-3 text-base font-normal" value={secondary} onChange={(e) => setSecondary(e.target.value as Lang | "")}>
                  <option value="">None</option>
                  <option value="en">English</option>
                  <option value="hi">हिंदी Hindi</option>
                  <option value="es">Español Spanish</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="mb-3 font-bold">What does {name || "your child"} love? Add 3–5 things.</p>
            <div className="mb-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Kind of thing">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={type.id === t.id}
                  onClick={() => setType(t)}
                  className={`rounded-2xl border-2 px-3 py-2 text-sm font-bold ${type.id === t.id ? "border-[var(--brand)] bg-[#fff1ea]" : "border-[var(--line)] bg-white"}`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <FavSearch type={type} onAdd={(e) => setFavs((f) => (f.length >= 8 || f.some((x) => x.name === e.name) ? f : [...f, { ...e, key: key.current++ }]))} />
            <div className="mt-4 flex min-h-12 flex-wrap gap-2">
              {favs.length === 0 && <span className="text-sm text-[var(--muted)]">Nothing added yet.</span>}
              {favs.map((f) => (
                <span key={f.key} className="flex items-center gap-2 rounded-2xl bg-[#f4efe7] px-3 py-2 text-sm font-semibold">
                  {TYPES.find((t) => t.id === f.type)?.emoji} {f.name}
                  {f.qlooId && <span className="text-xs text-emerald-700">✓</span>}
                  <button type="button" aria-label={`Remove ${f.name}`} className="rounded-full px-1 text-[var(--muted)] hover:text-[var(--ink)]" onClick={() => setFavs((x) => x.filter((y) => y.key !== f.key))}>
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">✓ means Qloo knows it. Unmatched names are searched again when the board is built.</p>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="mb-1 font-bold">Who&apos;s at home?</p>
            <p className="mb-3 text-sm text-[var(--muted)]">They become &ldquo;My people&rdquo; tiles. Add a grandparent&apos;s favourite singers and the agent finds things they can enjoy together.</p>
            <div className="space-y-2">
              {family.map((f, i) => (
                <div key={i} className="grid gap-2 rounded-2xl bg-[#faf7f2] p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input aria-label="Name" placeholder="Name, e.g. Dadu" className="rounded-xl border-2 border-[var(--line)] px-3 py-2.5" value={f.name} onChange={(e) => setFamily((fs) => fs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <select aria-label="Relation" className="rounded-xl border-2 border-[var(--line)] px-3 py-2.5" value={f.relation} onChange={(e) => setFamily((fs) => fs.map((x, j) => (j === i ? { ...x, relation: e.target.value } : x)))}>
                    {RELATIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button type="button" className="btn" aria-label="Remove" onClick={() => setFamily((fs) => fs.filter((_, j) => j !== i))}>✕</button>
                  <input
                    aria-label="Their favourite singers"
                    placeholder="Their favourite singers (optional), e.g. Mohammed Rafi"
                    className="rounded-xl border-2 border-[var(--line)] px-3 py-2.5 sm:col-span-3"
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

        {err && <p role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm">{err}</p>}

        <div className="mt-6 flex items-center gap-2">
          {step > 1 && (
            <button type="button" className="btn px-5 py-3" onClick={() => setStep((s) => s - 1)}>
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button type="button" className="btn btn-primary ml-auto px-6 py-3 text-base" onClick={next}>
              Next →
            </button>
          ) : (
            <button type="button" className="btn btn-primary ml-auto px-6 py-3 text-base" onClick={build}>
              ✨ Build {name ? `${name}'s` : "the"} board
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-[var(--muted)]">Please don&apos;t enter medical details. HomeTiles supports speech therapists; it doesn&apos;t replace them.</p>
    </div>
  );
}
