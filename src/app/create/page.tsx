"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { EntityRef, FamilyMember, Lang, Profile } from "@/lib/board/types";
import type { AgeBand, QlooType } from "@/lib/qloo/types";
import { setPendingProfile } from "@/lib/client/store";

const TYPES: { id: QlooType; label: string }[] = [
  { id: "urn:entity:tv_show", label: "TV show / cartoon" },
  { id: "urn:entity:movie", label: "Movie" },
  { id: "urn:entity:video_game", label: "Game" },
  { id: "urn:entity:artist", label: "Singer / music" },
  { id: "urn:entity:brand", label: "Snack / brand" },
  { id: "urn:entity:place", label: "Place / restaurant" },
  { id: "urn:entity:book", label: "Book" },
];

const AGES: { id: AgeBand; label: string; child?: boolean }[] = [
  { id: "24_and_younger", label: "Child (under 13)", child: true },
  { id: "24_and_younger", label: "Teen / young adult (13–24)" },
  { id: "25_to_29", label: "25–29" },
  { id: "30_to_34", label: "30–34" },
  { id: "35_to_44", label: "35–44" },
  { id: "45_to_54", label: "45–54" },
  { id: "55_and_older", label: "55+" },
];

interface LoveRow extends EntityRef {
  key: number;
}

function LoveInput({ row, onChange, onRemove }: { row: LoveRow; onChange: (r: LoveRow) => void; onRemove: () => void }) {
  const [q, setQ] = useState(row.name);
  const [hits, setHits] = useState<EntityRef[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2 || q === row.name) return;
    timer.current = setTimeout(async () => {
      const res = await fetch("/api/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q.trim(), types: [row.type] }) }).catch(() => null);
      const j = res ? await res.json().catch(() => ({ results: [] })) : { results: [] };
      setHits(j.results ?? []);
      setOpen(true);
    }, 350);
  }, [q, row.type, row.name]);

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <select aria-label="Type" className="btn py-2" value={row.type} onChange={(e) => onChange({ ...row, type: e.target.value as QlooType, qlooId: undefined })}>
        {TYPES.map((t) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
      <input
        aria-label="Favourite"
        className="min-w-48 flex-1 rounded-xl border border-[var(--line)] px-3 py-2"
        placeholder="e.g. Chhota Bheem"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          onChange({ ...row, name: e.target.value, qlooId: undefined });
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {row.qlooId ? <span className="text-xs font-semibold text-emerald-700">✓ found in Qloo</span> : row.name ? <span className="text-xs text-[var(--muted)]">will search</span> : null}
      <button type="button" className="btn" onClick={onRemove} aria-label="Remove favourite">✕</button>
      {open && hits.length > 0 && (
        <ul className="absolute left-0 top-full z-10 mt-1 w-full max-w-md overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-lg">
          {hits.map((h) => (
            <li key={h.qlooId}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left hover:bg-[#fff4e8]"
                onMouseDown={() => {
                  setQ(h.name);
                  onChange({ ...row, ...h });
                  setOpen(false);
                }}
              >
                {h.name} <span className="text-xs text-[var(--muted)]">{h.type.split(":")[2]}</span>
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
  const [name, setName] = useState("");
  const [ageIdx, setAgeIdx] = useState(0);
  const [city, setCity] = useState("");
  const [home, setHome] = useState<{ lat: number; lon: number } | undefined>();
  const [primary, setPrimary] = useState<Lang>("hi");
  const [secondary, setSecondary] = useState<Lang | "">("en");
  const [loves, setLoves] = useState<LoveRow[]>([
    { key: 1, name: "", type: "urn:entity:tv_show" },
    { key: 2, name: "", type: "urn:entity:video_game" },
    { key: 3, name: "", type: "urn:entity:brand" },
  ]);
  const [family, setFamily] = useState<(FamilyMember & { lovesText: string })[]>([{ name: "", relation: "mother", loves: [], lovesText: "" }]);
  const [err, setErr] = useState<string | null>(null);
  const nextKey = useRef(10);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const filled = loves.filter((l) => l.name.trim());
    if (!name.trim() || city.trim().length < 2 || !filled.length) {
      setErr("Please add a name, a city or neighbourhood, and at least one favourite.");
      return;
    }
    const age = AGES[ageIdx];
    const profile: Profile = {
      id: `p-${Date.now().toString(36)}`,
      displayName: name.trim(),
      ageBand: age.id,
      isChild: !!age.child,
      city: city.trim(),
      home,
      primaryLang: primary,
      secondaryLang: secondary || undefined,
      loves: filled.map(({ key: _k, ...l }) => ({ ...l, name: l.name.trim() })),
      family: family
        .filter((f) => f.name.trim())
        .map((f) => ({
          name: f.name.trim(),
          relation: f.relation,
          loves: f.lovesText
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

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-extrabold">Create a board</h1>
        <p className="mt-1 text-[var(--muted)]">
          About 2 minutes. Only Qloo entity IDs and the city are sent to Qloo, never names. Please don&apos;t enter sensitive health details.
        </p>
      </div>

      <fieldset className="grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:grid-cols-2">
        <legend className="px-1 font-bold">About them</legend>
        <label className="grid gap-1 text-sm font-semibold">
          First name (stays on this device)
          <input className="rounded-xl border border-[var(--line)] px-3 py-2 font-normal" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Age
          <select className="rounded-xl border border-[var(--line)] px-3 py-2 font-normal" value={ageIdx} onChange={(e) => setAgeIdx(Number(e.target.value))}>
            {AGES.map((a, i) => (
              <option key={a.label} value={i}>{a.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
          Neighbourhood and city
          <div className="flex flex-wrap gap-2">
            <input className="min-w-56 flex-1 rounded-xl border border-[var(--line)] px-3 py-2 font-normal" placeholder="e.g. Rajouri Garden, New Delhi" value={city} onChange={(e) => setCity(e.target.value)} maxLength={120} />
            <button
              type="button"
              className="btn"
              onClick={() =>
                navigator.geolocation?.getCurrentPosition(
                  (p) => setHome({ lat: Math.round(p.coords.latitude * 1000) / 1000, lon: Math.round(p.coords.longitude * 1000) / 1000 }),
                  () => setErr("Couldn't get your location. The city alone works fine."),
                )
              }
            >
              📍 {home ? "Home set (≈100 m)" : "Use my location"}
            </button>
          </div>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Family language
          <select className="rounded-xl border border-[var(--line)] px-3 py-2 font-normal" value={primary} onChange={(e) => setPrimary(e.target.value as Lang)}>
            <option value="hi">हिंदी Hindi</option>
            <option value="es">Español Spanish</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Second language (optional)
          <select className="rounded-xl border border-[var(--line)] px-3 py-2 font-normal" value={secondary} onChange={(e) => setSecondary(e.target.value as Lang | "")}>
            <option value="">None</option>
            <option value="en">English</option>
            <option value="hi">हिंदी Hindi</option>
            <option value="es">Español Spanish</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
        <legend className="px-1 font-bold">Things they love (3–5 is ideal)</legend>
        {loves.map((row, i) => (
          <LoveInput
            key={row.key}
            row={row}
            onChange={(r) => setLoves((ls) => ls.map((x, j) => (j === i ? r : x)))}
            onRemove={() => setLoves((ls) => ls.filter((_, j) => j !== i))}
          />
        ))}
        {loves.length < 8 && (
          <button type="button" className="btn" onClick={() => setLoves((ls) => [...ls, { key: nextKey.current++, name: "", type: "urn:entity:tv_show" }])}>
            + Add another
          </button>
        )}
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
        <legend className="px-1 font-bold">Family (for &ldquo;My people&rdquo; and &ldquo;Talk together&rdquo;)</legend>
        {family.map((f, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
            <input aria-label="Name" placeholder="Name, e.g. Dadu" className="rounded-xl border border-[var(--line)] px-3 py-2" value={f.name} onChange={(e) => setFamily((fs) => fs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <select aria-label="Relation" className="rounded-xl border border-[var(--line)] px-3 py-2" value={f.relation} onChange={(e) => setFamily((fs) => fs.map((x, j) => (j === i ? { ...x, relation: e.target.value } : x)))}>
              {["mother", "father", "grandmother", "grandfather", "sister", "brother", "aunt", "uncle", "friend", "carer"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <input aria-label="Their favourite singers" placeholder="Their favourite singers (optional, comma-separated)" className="rounded-xl border border-[var(--line)] px-3 py-2" value={f.lovesText} onChange={(e) => setFamily((fs) => fs.map((x, j) => (j === i ? { ...x, lovesText: e.target.value } : x)))} />
            <button type="button" className="btn" aria-label="Remove family member" onClick={() => setFamily((fs) => fs.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        {family.length < 6 && (
          <button type="button" className="btn" onClick={() => setFamily((fs) => [...fs, { name: "", relation: "grandfather", loves: [], lovesText: "" }])}>
            + Add family member
          </button>
        )}
      </fieldset>

      {err && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3">{err}</p>}
      <button type="submit" className="btn btn-primary text-base">Build the board →</button>
    </form>
  );
}
