"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { applySuggestions } from "@/lib/board/engine";
import { toObf } from "@/lib/board/obf";
import type { Board, Category, Lang, Suggestion, TapEvent, Tile } from "@/lib/board/types";
import { pick } from "@/lib/board/vocab";
import { getTaps, loadBoard, logTap, saveBoard, setTaps, tapCounts } from "@/lib/client/store";
import { speak } from "@/lib/client/speech";
import { TileButton, type LabelMode } from "@/components/TileButton";
import { WhyDialog } from "@/components/WhyDialog";
import { TraceDialog } from "@/components/TraceDialog";
import { CompareDialog } from "@/components/CompareDialog";
import { RefreshDialog } from "@/components/RefreshDialog";
import { HeatMap } from "@/components/HeatMap";

const LANG_NAME: Record<Lang, string> = { en: "English", hi: "हिंदी", es: "Español" };
const COLS = [3, 4, 5, 6];
const ROTATING: Category[] = ["food", "places", "favourites", "fun", "together", "new"];

export default function BoardPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [folder, setFolder] = useState<Category>("favourites");
  const [sentence, setSentence] = useState<Tile[]>([]);
  const [labelMode, setLabelMode] = useState<LabelMode>("both");
  const [cols, setCols] = useState(4);
  const [why, setWhy] = useState<Tile | null>(null);
  const [showTrace, setShowTrace] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [refresh, setRefresh] = useState<{ loading: boolean; suggestions: Suggestion[]; counts: Record<string, number>; seededBy: string[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    const b = loadBoard(id);
    setBoard(b);
    if (b?.folders[0]) setFolder(b.folders[0].id);
    setLoaded(true);
    window.speechSynthesis?.getVoices();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const primary = board?.profile.primaryLang ?? "en";
  const secondary = board?.profile.secondaryLang;
  const speakLang: Lang = labelMode === "secondary" && secondary ? secondary : primary;

  const update = useCallback((b: Board) => {
    saveBoard(b);
    setBoard(b);
  }, []);

  const onTap = useCallback(
    (t: Tile) => {
      if (!board) return;
      speak(pick(t.speak, speakLang), speakLang);
      setSentence((s) => [...s, t].slice(-12));
      logTap(board.id, t.id);
    },
    [board, speakLang],
  );

  const activeFolder = useMemo(() => board?.folders.find((f) => f.id === folder) ?? board?.folders[0], [board, folder]);

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
    let i = 0;
    for (const f of board.folders) {
      f.tileIds.forEach((id, idx) => {
        const t = board.tiles[id];
        if (!t) return;
        i++;
        // Favourite-heavy, realistic skew; roughly a third of rotating tiles go unused.
        const base = t.kind === "core" ? 6 : t.kind === "safety" ? 1 : t.kind === "people" ? 4 : Math.max(0, Math.round((t.score ?? 0.5) * 14 - idx * 1.6));
        const n = t.kind === "rotating" && (i * 7) % 3 === 0 ? 0 : base;
        for (let k = 0; k < n; k++) taps.push({ tileId: id, ts: now - ((k * 9973 + i * 131) % (6.5 * 86400000)) });
      });
    }
    setTaps(board.id, taps);
    setToast(`Simulated a week: ${taps.length} taps logged on this device`);
    void runRefresh();
  }

  function exportObf() {
    if (!board) return;
    const blob = new Blob([JSON.stringify(toObf(board, primary), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${board.profile.displayName.toLowerCase()}-hometiles.obf`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (!loaded) return <div className="p-10 text-center text-[var(--muted)]">Loading…</div>;
  if (!board)
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-lg">No board on this device yet.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/" className="btn btn-primary">Try a demo persona</Link>
          <Link href="/create" className="btn">Create a board</Link>
        </div>
      </div>
    );

  const tilesOf = (ids: string[]) => ids.map((id) => board.tiles[id]).filter(Boolean);
  const gridStyle = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
      {board.mode.qloo === "mock" && (
        <div className="no-print mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
          <strong>Demo data (mock mode).</strong> Tiles come from a synthetic catalogue shaped like Qloo&apos;s API. Set <code>QLOO_API_KEY</code> to switch to live Qloo.
        </div>
      )}

      {/* Toolbar */}
      <div className="no-print mb-3 flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-xl font-extrabold">{board.profile.displayName}&apos;s board</h1>
        <span className="rounded-lg bg-[#f4efe7] px-2 py-1 text-xs font-semibold">
          Qloo: {board.mode.qloo} · agent: {board.mode.agent} · v{board.version}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={() => setShowCompare(true)}>⚖️ Without Qloo</button>
          <button type="button" className="btn" onClick={() => setShowTrace(true)}>🔎 Qloo trace ({board.trace.length})</button>
          <button type="button" className="btn" onClick={simulateWeek}>⏩ Simulate a week</button>
          <button type="button" className="btn" onClick={runRefresh}>🔄 Weekly refresh</button>
          <button type="button" className="btn" onClick={exportObf}>⬇️ Export .obf</button>
          <button type="button" className="btn" onClick={() => window.print()}>🖨️ Print</button>
        </div>
      </div>

      {/* Sentence bar */}
      <div className="no-print sticky top-0 z-20 mb-3 flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-sm">
        <div className="flex min-h-12 flex-1 flex-wrap items-center gap-1.5 px-1" aria-live="polite" aria-label="Sentence">
          {sentence.length === 0 && <span className="text-sm text-[var(--muted)]">Tap tiles to build a sentence…</span>}
          {sentence.map((t, i) => (
            <span key={i} className="rounded-lg px-2 py-1 text-[15px] font-semibold" style={{ background: `var(--c-${t.category})` }}>
              {t.emoji} {pick(t.label, speakLang)}
            </span>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => speak(sentence.map((t) => pick(t.label, speakLang)).join(" "), speakLang)} disabled={!sentence.length}>
          🔊 Speak
        </button>
        <button type="button" className="btn" onClick={() => setSentence((s) => s.slice(0, -1))} aria-label="Delete last word">⌫</button>
        <button type="button" className="btn" onClick={() => setSentence([])} aria-label="Clear sentence">✕</button>
      </div>

      {/* Settings */}
      <div className="no-print mb-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1.5">
          Labels
          <select className="btn py-1" value={labelMode} onChange={(e) => setLabelMode(e.target.value as LabelMode)}>
            <option value="both">{LANG_NAME[primary]}{secondary ? ` + ${LANG_NAME[secondary]}` : ""}</option>
            <option value="primary">{LANG_NAME[primary]} only</option>
            {secondary && <option value="secondary">{LANG_NAME[secondary]} only</option>}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          Columns
          <select className="btn py-1" value={cols} onChange={(e) => setCols(Number(e.target.value))}>
            {COLS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Core strip */}
      <section aria-label="Core words" className="no-print mb-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(5.2rem, 1fr))" }}>
        {tilesOf(board.coreIds).map((t) => (
          <TileButton key={t.id} tile={t} primary={primary} secondary={secondary} labelMode={labelMode} onTap={onTap} />
        ))}
      </section>

      {/* Folder tabs */}
      <nav className="no-print mb-3 flex gap-2 overflow-x-auto pb-1" aria-label="Folders">
        {board.folders.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFolder(f.id)}
            aria-current={activeFolder?.id === f.id}
            className={`btn whitespace-nowrap ${activeFolder?.id === f.id ? "ring-2 ring-[var(--brand)]" : ""}`}
            style={{ background: `var(--c-${f.id})` }}
          >
            <span aria-hidden>{f.emoji}</span> {pick(f.title, primary)}
            {secondary && <span className="text-xs font-normal text-[var(--muted)]"> {pick(f.title, secondary)}</span>}
            <span className="text-xs font-normal text-[var(--muted)]">({f.tileIds.length})</span>
          </button>
        ))}
      </nav>

      {/* Active folder grid */}
      {activeFolder && (
        <section className="no-print" aria-label={activeFolder.title.en}>
          {activeFolder.id === "places" && board.heat?.length ? (
            <div className="mb-3 flex flex-wrap items-start gap-3">
              <HeatMap cells={board.heat} home={board.profile.home} />
              <p className="max-w-sm text-sm text-[var(--muted)]">
                The agent first asked Qloo where this kind of taste clusters around home, then searched for places inside those hot-spots. Tap ⓘ on a tile to see its distance and evidence.
              </p>
            </div>
          ) : null}
          {activeFolder.id === "together" && (
            <p className="mb-2 text-sm text-[var(--muted)]">Things to enjoy with family, found by comparing tastes with Qloo. Conversations, not just requests.</p>
          )}
          <div className="grid gap-2 sm:gap-3" style={gridStyle}>
            {tilesOf(activeFolder.tileIds).map((t) => (
              <TileButton key={t.id} tile={t} primary={primary} secondary={secondary} labelMode={labelMode} onTap={onTap} onInfo={setWhy} />
            ))}
          </div>
        </section>
      )}

      {board.notes.length > 0 && (
        <details className="no-print mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Agent notes</summary>
          <ul className="mt-2 list-disc pl-5">
            {board.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </details>
      )}

      {/* Print layout: every folder on paper */}
      <div className="print-only">
        <h1 className="mb-2 text-xl font-bold">{board.profile.displayName}&apos;s HomeTiles board</h1>
        {[{ id: "core", title: { en: "Core" }, tileIds: board.coreIds }, ...board.folders].map((f) => (
          <section key={f.id} className="mb-3">
            <h2 className="mb-1 font-bold">{pick(f.title, primary)}</h2>
            <div className="grid grid-cols-6 gap-1.5">
              {tilesOf(f.tileIds).map((t) => (
                <div key={t.id} className="tile" style={{ background: `var(--c-${t.category})` }}>
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
        <div role="status" className="no-print fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[var(--ink)] px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
