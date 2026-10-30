"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { applySuggestions } from "@/lib/board/engine";
import { toObf } from "@/lib/board/obf";
import type { Board, Category, Suggestion, TapEvent, Tile } from "@/lib/board/types";
import { LANGUAGES, type Lang } from "@/lib/i18n";
import { pick } from "@/lib/board/vocab";
import {
  addSaid,
  getSaid,
  getSettings,
  getTaps,
  isKidLocked,
  loadBoard,
  saveBoard,
  saveSettings,
  setKidLocked,
  setTaps,
  tapCounts,
  type KidSettings,
  type SaidEntry,
} from "@/lib/client/store";
import { KidBoard } from "@/components/kid/KidBoard";
import { composeSentence } from "@/lib/board/sentence";
import { WhyDialog } from "@/components/WhyDialog";
import { TraceDialog } from "@/components/TraceDialog";
import { CompareDialog } from "@/components/CompareDialog";
import { RefreshDialog } from "@/components/RefreshDialog";
import { HeatMap } from "@/components/HeatMap";

const ROTATING: Category[] = ["food", "places", "favourites", "fun", "together", "new"];
const LANG_NAME = Object.fromEntries(Object.entries(LANGUAGES).map(([k, v]) => [k, v.english])) as Record<Lang, string>;

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; t: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="grid gap-1 rounded-2xl bg-[var(--surface-2)] p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
            className={`rounded-xl px-2 py-2 text-sm font-bold transition-all ${value === o.v ? "bg-white shadow-[0_3px_0_var(--line)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BoardPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [locked, setLocked] = useState(false);
  const [settings, setSettingsState] = useState<KidSettings | null>(null);
  const [why, setWhy] = useState<Tile | null>(null);
  const [showTrace, setShowTrace] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [refresh, setRefresh] = useState<{ loading: boolean; suggestions: Suggestion[]; counts: Record<string, number>; seededBy: string[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [stats, setStats] = useState<{ taps: number; top: [string, number][]; said: SaidEntry[] }>({ taps: 0, top: [], said: [] });

  const refreshStats = useCallback((b: Board) => {
    setPreviewKey((k) => k + 1);
    const counts = tapCounts(getTaps(b.id));
    setStats({
      taps: Object.values(counts).reduce((s, n) => s + n, 0),
      top: Object.entries(counts)
        .filter(([id]) => b.tiles[id] && b.tiles[id].kind !== "core")
        .sort((a, c) => c[1] - a[1])
        .slice(0, 5),
      said: getSaid(b.id).slice(0, 4),
    });
  }, []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    const b = loadBoard(id);
    setBoard(b);
    if (b) {
      setSettingsState(getSettings(b.id));
      refreshStats(b);
    }
    // A lock with no board left to show would trap the device on an empty page.
    if (isKidLocked() && !b) setKidLocked(false);
    setLocked(isKidLocked() && !!b);
    setLoaded(true);
    window.speechSynthesis?.getVoices();
  }, [refreshStats]);

  // While the child lock is on, the browser back button can't leave the board.
  useEffect(() => {
    if (!locked) return;
    history.pushState({ kid: true }, "");
    const onPop = () => history.pushState({ kid: true }, "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [locked]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const update = useCallback(
    (b: Board) => {
      saveBoard(b);
      setBoard(b);
      refreshStats(b);
    },
    [refreshStats],
  );

  const changeSettings = (s: KidSettings) => {
    if (!board) return;
    saveSettings(board.id, s);
    setSettingsState(s);
  };

  function startKidMode() {
    setKidLocked(true);
    setLocked(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function unlock() {
    setKidLocked(false);
    setLocked(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    if (board) refreshStats(board);
  }

  async function runRefresh() {
    if (!board) return;
    const counts = tapCounts(getTaps(board.id));
    setRefresh({ loading: true, suggestions: [], counts, seededBy: [] });
    const tiles = board.folders
      .filter((f) => ROTATING.includes(f.id))
      .flatMap((f) =>
        f.tileIds
          .map((id) => board.tiles[id])
          .filter((t): t is Tile => !!t && t.kind === "rotating")
          .map((t) => ({ id: t.id, folder: f.id, qlooId: t.entity?.qlooId, label: t.label.en.slice(0, 150), moved: t.moved, locked: t.locked })),
      )
      .slice(0, 80);
    const relevant = Object.fromEntries(Object.entries(counts).filter(([id]) => tiles.some((t) => t.id === id)));
    try {
      const res = await fetch("/api/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: board.profile, tiles, counts: relevant }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Refresh failed");
      setRefresh({ loading: false, suggestions: j.suggestions, counts, seededBy: j.seededBy ?? [] });
      if (j.trace?.length) update({ ...board, trace: [...board.trace, ...j.trace] });
    } catch (err) {
      setRefresh(null);
      setToast((err as Error).message);
    }
  }

  function simulateWeek() {
    if (!board) return;
    const now = Date.now();
    const taps: TapEvent[] = [];
    let n = 0;
    const tile = (id: string) => board.tiles[id];
    const fav = board.folders.find((f) => f.id === "favourites")?.tileIds ?? [];
    const food = board.folders.find((f) => f.id === "food")?.tileIds ?? [];
    const places = board.folders.find((f) => f.id === "places")?.tileIds ?? [];
    const fun = board.folders.find((f) => f.id === "fun")?.tileIds ?? [];
    // Realistic little "utterances" over 7 days at typical hours: I want <snack> (morning), I want <show> (evening), go <place>...
    const patterns: { hour: number; seq: string[] }[] = [];
    for (let d = 0; d < 7; d++) {
      patterns.push({ hour: 8, seq: ["core-i", "core-want", food[d % Math.min(3, food.length)]] });
      patterns.push({ hour: 18, seq: ["core-i", "core-want", fav[d % Math.min(3, fav.length)]] });
      patterns.push({ hour: 17, seq: ["core-go", places[d % Math.min(2, places.length)]] });
      if (d % 2 === 0) patterns.push({ hour: 19, seq: [fun[0], fav[0]] });
      if (d % 3 === 0) patterns.push({ hour: 21, seq: ["safety-toilet"] });
      patterns.push({ hour: 13, seq: ["core-more", food[0]] });
      const day = now - (d + 0.3) * 86400000;
      for (const p of patterns.splice(0)) {
        const base = new Date(day);
        base.setHours(p.hour, (d * 7) % 50, 0, 0);
        const seq = p.seq.filter((id) => id && tile(id));
        seq.forEach((id, k) => taps.push({ tileId: id, ts: base.getTime() + k * 4000 + n++ }));
        if (d < 2 && seq.length > 1) {
          const tiles = seq.map(tile);
          addSaid(board.id, { text: composeSentence(tiles, board.profile.primaryLang), tileIds: seq, ts: base.getTime() + 9000 });
        }
      }
    }
    setTaps(board.id, taps);
    refreshStats(board);
    setToast(`Simulated a week: ${taps.length} taps on this device. The "For me" board now predicts from them.`);
    void runRefresh();
  }

  function exportObf() {
    if (!board) return;
    const blob = new Blob([JSON.stringify(toObf(board, board.profile.primaryLang), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${board.profile.displayName.toLowerCase()}-hometiles.obf`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (!loaded) return <div className="p-10 text-center text-[var(--muted)]">Loading…</div>;
  if (!board || !settings)
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-6xl">🧩</p>
        <p className="font-display mt-3 text-2xl font-extrabold">No board on this device yet</p>
        <p className="mt-1 text-[var(--muted)]">Make one for your child, or watch the agent build one for a demo child.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/create" className="btn btn-primary btn-lg">＋ Make a board</Link>
          <Link href="/#try" className="btn btn-lg">▶ Try a demo child</Link>
        </div>
      </div>
    );

  if (locked)
    return (
      <div className="fixed inset-0 z-[100] bg-[var(--kid-bg)]">
        <KidBoard board={board} settings={settings} locked onUnlock={unlock} />
      </div>
    );

  const p = board.profile;
  const primary = p.primaryLang;

  return (
    <div className="relative mx-auto max-w-7xl px-3 py-6 sm:px-4">
      {board.mode.qloo === "mock" && (
        <div className="no-print mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-2.5 text-sm">
          <strong>Demo data.</strong> No Qloo key yet, so tiles come from a synthetic catalogue shaped exactly like Qloo&apos;s API. Add <code>QLOO_API_KEY</code> for live data.
        </div>
      )}

      <div className="no-print card mb-6 flex flex-wrap items-center gap-4 p-4 sm:p-5">
        <span aria-hidden className="font-display grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#ec6233] to-[#6d4fe0] text-3xl font-extrabold text-white shadow-[0_4px_0_#4a33a8]">
          {p.displayName[0]?.toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">Parent view</p>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{p.displayName}&apos;s board</h1>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs font-semibold">
            <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1">📍 {p.city}</span>
            <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1">
              🗣️ {LANG_NAME[p.primaryLang]}
              {p.secondaryLang ? ` + ${LANG_NAME[p.secondaryLang]}` : ""}
            </span>
            {p.loves.slice(0, 4).map((l) => (
              <span key={l.name} className="rounded-full bg-[var(--grape-soft)] px-2.5 py-1">💜 {l.name}</span>
            ))}
          </div>
        </div>
        <button type="button" onClick={startKidMode} className="btn btn-primary btn-lg w-full flex-col gap-0 sm:w-auto">
          <span className="font-display text-xl">▶ Give to {p.displayName}</span>
          <span className="text-xs font-semibold opacity-90">full screen · locks the menus</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        {/* Live preview of exactly what the child sees */}
        <section className="no-print">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-display text-lg font-extrabold">What {p.displayName} sees</span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--muted)] shadow-sm">👆 tap to try it</span>
            <span className="rounded-full bg-[var(--grape-soft)] px-2.5 py-1 text-xs font-semibold">
              <span className="font-extrabold text-[var(--grape)]">?</span> shows why a tile is there
            </span>
          </div>
          <div className="phone">
            <div className="phone-screen h-[72vh] min-h-[540px]">
              <KidBoard key={previewKey} board={board} settings={settings} locked={false} onInfo={setWhy} compact />
            </div>
          </div>
        </section>

        {/* Parent tools */}
        <aside className="no-print space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-extrabold">
              <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand-soft)] text-lg">🧒</span> Child mode
            </h2>
            <div className="space-y-3">
              <Seg
                label="Which board"
                value={settings.boards}
                onChange={(v) => changeSettings({ ...settings, boards: v })}
                options={[
                  { v: "both", t: "Both" },
                  { v: "smart", t: "⭐ For me (smart)" },
                  { v: "classic", t: "📁 All words" },
                ]}
              />
              <p className="text-xs leading-relaxed text-[var(--muted)]">
                <strong>For me</strong> learns on this device what {p.displayName} says, when, and what usually comes next, and puts likely words on one screen.{" "}
                <strong>All words</strong> keeps every word in a fixed folder, so it never moves. Core words stay in the same place on both.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Seg
                  label="Tile size"
                  value={settings.size}
                  onChange={(v) => changeSettings({ ...settings, size: v })}
                  options={[
                    { v: "m", t: "M" },
                    { v: "l", t: "L" },
                    { v: "xl", t: "XL" },
                  ]}
                />
                <Seg
                  label="Labels"
                  value={settings.labels}
                  onChange={(v) => changeSettings({ ...settings, labels: v })}
                  options={[
                    { v: "both", t: "Both" },
                    { v: "primary", t: LANG_NAME[primary].slice(0, 3) },
                    ...(p.secondaryLang ? [{ v: "secondary" as const, t: LANG_NAME[p.secondaryLang].slice(0, 3) }] : []),
                  ]}
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="h-5 w-5" checked={settings.speakOnTap} onChange={(e) => changeSettings({ ...settings, speakOnTap: e.target.checked })} />
                Speak each tile when tapped
              </label>
              <p className="rounded-2xl bg-[var(--surface-2)] px-3 py-2.5 text-xs">
                🔒 In child mode the menus are hidden and the back button is blocked. To exit, <strong>press and hold the lock for 2 seconds</strong>.
              </p>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center">
              <h2 className="flex items-center gap-2 text-xl font-extrabold">
                <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--c-fun)] text-lg">📊</span> This week
              </h2>
              <span className="ml-auto text-sm text-[var(--muted)]">{stats.taps} taps · board v{board.version}</span>
            </div>
            {stats.top.length ? (
              <ol className="mb-3 space-y-1">
                {stats.top.map(([id, n]) => (
                  <li key={id} className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold" style={{ background: `var(--c-${board.tiles[id].category})` }}>
                    {board.tiles[id].emoji} {pick(board.tiles[id].label, primary)}
                    <span className="ml-auto font-mono text-xs">{n}×</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mb-3 text-sm text-[var(--muted)]">No taps yet. Try the preview, or simulate a week.</p>
            )}
            {stats.said.length > 0 && (
              <div className="mb-3 text-sm">
                <div className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Recently said</div>
                {stats.said.map((s) => (
                  <div key={s.ts}>“{s.text}”</div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn" onClick={simulateWeek}>⏩ Simulate a week</button>
              <button type="button" className="btn btn-primary" onClick={runRefresh}>🔄 Weekly refresh</button>
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">Taps never leave this device. The refresh sends only anonymous Qloo IDs and counts, and you approve every change.</p>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-extrabold">
              <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--grape-soft)] text-lg">🔎</span> How Qloo built it
            </h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn" onClick={() => setShowCompare(true)}>⚖️ With vs without Qloo</button>
              <button type="button" className="btn" onClick={() => setShowTrace(true)}>🔎 Every Qloo call ({board.trace.length})</button>
            </div>
            {board.heat?.length ? (
              <div className="mt-3">
                <HeatMap cells={board.heat} home={p.home} />
              </div>
            ) : null}
            {board.notes.length > 0 && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-semibold">Agent notes</summary>
                <ul className="mt-1 list-disc pl-5">
                  {board.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-extrabold">
              <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-lg">🎒</span> Take it anywhere
            </h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn" onClick={exportObf}>⬇️ Export for Cboard (.obf)</button>
              <button type="button" className="btn" onClick={() => window.print()}>🖨️ Print paper board</button>
              <Link href="/create" className="btn btn-primary">＋ Board for another child</Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Print layout: every folder on paper */}
      <div className="print-only">
        <h1 className="mb-2 text-xl font-bold">{p.displayName}&apos;s HomeTiles board</h1>
        {[{ id: "core", title: { en: "Core" }, tileIds: board.coreIds }, ...board.folders].map((f) => (
          <section key={f.id} className="mb-3">
            <h2 className="mb-1 font-bold">{pick(f.title, primary)}</h2>
            <div className="grid grid-cols-6 gap-1.5">
              {f.tileIds
                .map((id) => board.tiles[id])
                .filter(Boolean)
                .map((t) => (
                  <div key={t.id} className="kid-tile" style={{ background: `var(--c-${t.category})`, borderColor: `var(--b-${t.category})` }}>
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="text-xs font-bold">{pick(t.label, primary)}</span>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>

      {why && (
        <WhyDialog
          tile={why}
          lang={primary}
          onClose={() => setWhy(null)}
          onToggleLock={(t) => {
            const next = { ...board, tiles: { ...board.tiles, [t.id]: { ...t, locked: !t.locked } } };
            update(next);
            setWhy(next.tiles[t.id]);
          }}
        />
      )}
      {showTrace && <TraceDialog trace={board.trace} onClose={() => setShowTrace(false)} />}
      {showCompare && <CompareDialog board={board} lang={primary} onClose={() => setShowCompare(false)} />}
      {refresh && (
        <RefreshDialog
          board={board}
          lang={primary}
          counts={refresh.counts}
          suggestions={refresh.suggestions}
          seededBy={refresh.seededBy}
          loading={refresh.loading}
          onClose={() => setRefresh(null)}
          onApply={(accepted) => {
            update(applySuggestions(board, accepted));
            setRefresh(null);
            setToast(`Applied ${accepted.length} change${accepted.length === 1 ? "" : "s"}. Board v${board.version + 1}`);
          }}
        />
      )}
      {toast && (
        <div role="status" className="fade-up no-print fixed bottom-5 left-1/2 z-50 max-w-[92vw] -translate-x-1/2 rounded-2xl bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-lg)]">
          {toast}
        </div>
      )}
    </div>
  );
}
