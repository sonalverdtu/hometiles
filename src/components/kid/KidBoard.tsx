"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Board, Category, Lang, TapEvent, Tile } from "@/lib/board/types";
import { FOLDER_META, pick } from "@/lib/board/vocab";
import { UI } from "@/lib/i18n";
import { nextActions, predict, stabilize, type Prediction } from "@/lib/board/smart";
import { NO_TOPIC, topicOf, type Topic } from "@/lib/board/topic";
import { composeSentence, tileSpeech } from "@/lib/board/sentence";
import { addSaid, getSaid, getTaps, logTap, type KidSettings, type SaidEntry } from "@/lib/client/store";
import { speak } from "@/lib/client/speech";
import { BigTile, tileMin, type TileSize } from "./BigTile";
import { HoldToUnlock } from "./HoldToUnlock";

type View = "smart" | "classic";
type Drawer = "need" | "words" | null;

// The first 8 core slots, identical on both boards (motor planning). "All words" adds its extra core words after these.
const CORE_SLOTS = ["core-i", "core-want", "core-more", "core-stop", "core-yes", "core-no", "core-go", "safety-help"];
// An utterance is over after this long without a tap; then the topic moves on.
const QUIET_MS = 30_000;

export function KidBoard({
  board,
  settings,
  locked,
  onUnlock,
  onInfo,
  compact,
}: {
  board: Board;
  settings: KidSettings;
  locked: boolean;
  onUnlock?: () => void;
  onInfo?: (t: Tile) => void;
  compact?: boolean;
}) {
  const primary = board.profile.primaryLang;
  const secondary = board.profile.secondaryLang;
  const lang: Lang = settings.labels === "secondary" && secondary ? secondary : primary;
  const size: TileSize = compact ? (settings.size === "xl" ? "l" : settings.size === "l" ? "m" : "s") : settings.size;
  const [view, setView] = useState<View>(settings.boards === "classic" ? "classic" : "smart");
  const [folder, setFolder] = useState<Category | null>(null);
  const [sentence, setSentence] = useState<Tile[]>([]);
  const [taps, setTapsState] = useState<TapEvent[]>([]);
  const [said, setSaid] = useState<SaidEntry[]>([]);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [topic, setTopic] = useState<Topic>(NO_TOPIC);
  const [row, setRow] = useState<{ from: Prediction[] | null; shown: Prediction[] }>({ from: null, shown: [] });

  useEffect(() => {
    const t = getTaps(board.id);
    setTapsState(t);
    setSaid(getSaid(board.id));
    setTopic(topicOf(board, t));
  }, [board]);

  // The topic follows whole utterances (spoken, cleared, or a quiet pause), never single taps, so the row
  // drifts towards what the child is talking about instead of jumping around mid-sentence.
  useEffect(() => {
    if (!taps.length) return;
    const t = setTimeout(() => setTopic(topicOf(board, taps)), QUIET_MS);
    return () => clearTimeout(t);
  }, [board, taps]);

  useEffect(() => {
    if (settings.boards === "classic") setView("classic");
    if (settings.boards === "smart") setView("smart");
  }, [settings.boards]);

  const last = sentence[sentence.length - 1]?.id ?? null;
  // Enough "Maybe next" tiles to fill the screen under the core rows.
  const take = compact ? 12 : 18;
  const actions = nextActions(board, last, 6, CORE_SLOTS);
  const ranked = useMemo(() => predict(board, last, taps, new Date(), take + 8, topic), [board, last, taps, take, topic]);
  // Steady row: tiles keep their slots, and at most 3 slots change per tap (stabilize in smart.ts).
  let predictions = row.shown;
  if (row.from !== ranked) {
    predictions = stabilize(row.shown.map((p) => p.tile.id), ranked, take);
    setRow({ from: ranked, shown: predictions });
  }
  // The smart board keeps the 8 most-used core words so predictions fit on one phone screen; "All words" shows every core word.
  const slotCore = CORE_SLOTS.map((id) => board.tiles[id]).filter(Boolean);
  const extraCore = board.coreIds.filter((id) => !CORE_SLOTS.includes(id)).map((id) => board.tiles[id]).filter(Boolean);
  const core = view === "smart" ? slotCore : [...slotCore, ...extraCore];
  // The smart board must still reach every safety word and every core word in one tap: two drawers under the core row.
  const safetyTiles = board.folders.find((f) => f.id === "safety")?.tileIds.filter((id) => !CORE_SLOTS.includes(id)).map((id) => board.tiles[id]).filter(Boolean) ?? [];
  const drawerTiles = drawer === "need" ? safetyTiles : drawer === "words" ? extraCore : [];

  const tap = useCallback(
    (t: Tile) => {
      if (settings.speakOnTap) speak(tileSpeech(t, lang), lang, tileSpeech(t, "en")); // says exactly what the tile shows
      setSentence((s) => [...s, t].slice(-10));
      // Only the child's own taps (child mode) teach the predictions; a parent trying the preview doesn't.
      if (locked) logTap(board.id, t.id);
      setTapsState((x) => [...x, { tileId: t.id, ts: Date.now() }]);
    },
    [board.id, lang, locked, settings.speakOnTap],
  );

  const sayAll = () => {
    const text = composeSentence(sentence, lang);
    if (!text) return;
    speak(text, lang, composeSentence(sentence, "en"));
    const entry = { text, tileIds: sentence.map((t) => t.id), ts: Date.now() };
    if (locked) addSaid(board.id, entry); // like taps: a parent's preview sentences aren't the child's history
    setSaid((s) => [entry, ...s.filter((x) => x.text !== text)].slice(0, 20));
    setTopic(topicOf(board, taps));
  };

  const clear = () => {
    setSentence([]);
    setTopic(topicOf(board, taps));
  };

  const grid = { gridTemplateColumns: `repeat(auto-fill, minmax(${tileMin(size)}, 1fr))` };
  const coreSize: TileSize = size === "xl" ? "s" : "xs";
  const openFolder = board.folders.find((f) => f.id === folder);

  return (
    <div className={`flex h-full flex-col ${locked ? "bg-[var(--kid-bg)]" : ""}`} onContextMenu={locked ? (e) => e.preventDefault() : undefined}>
      {/* Sentence bar */}
      <div className="flex items-stretch gap-2 border-b border-[var(--line)] bg-white/90 p-2 shadow-[0_6px_16px_-12px_rgb(60_35_10/0.4)]">
        <div className="flex min-h-14 flex-1 flex-wrap items-center gap-1.5 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-2 py-1" aria-live="polite" aria-label="What I'm saying">
          {sentence.length === 0 && <span className="px-1 text-sm text-[var(--muted)]">{UI[lang].tapHint}</span>}
          {sentence.map((t, i) => (
            <span key={i} className="pop-in font-display flex items-center gap-1 rounded-xl border-2 px-2 py-0.5 text-base font-bold" style={{ background: `var(--c-${t.category})`, borderColor: `var(--b-${t.category})` }}>
              <span aria-hidden>{t.emoji}</span>
              {pick(t.label, lang)}
            </span>
          ))}
          {sentence.length > 1 && (
            <span className="basis-full px-1 text-sm font-semibold text-[var(--go)]" aria-label="Will say">
              🔊 {composeSentence(sentence, lang)}
            </span>
          )}
        </div>
        <button type="button" onClick={sayAll} disabled={!sentence.length} className="kid-action border-[#0e5e2c] bg-[var(--go)] text-white shadow-[0_4px_0_#0e5e2c] disabled:opacity-40" aria-label="Speak the sentence">
          <span className="text-2xl" aria-hidden>🔊</span>
          <span className="text-xs font-bold">{UI[lang].speak}</span>
        </button>
        <button type="button" onClick={() => setSentence((s) => s.slice(0, -1))} className="kid-action bg-white" aria-label="Delete last word">
          <span className="text-2xl" aria-hidden>⌫</span>
        </button>
        <button type="button" onClick={clear} className="kid-action bg-white" aria-label="Clear">
          <span className="text-2xl" aria-hidden>🧹</span>
        </button>
        {locked && onUnlock && (
          <div className="flex items-center pl-1">
            <HoldToUnlock onUnlock={onUnlock} />
          </div>
        )}
      </div>

      {/* Board switch */}
      {settings.boards === "both" && (
        <div className="grid grid-cols-2 gap-2 px-2 pt-2" role="tablist" aria-label="Board">
          <button
            type="button"
            role="tab"
            aria-selected={view === "smart"}
            onClick={() => setView("smart")}
            className={`font-display rounded-2xl border-2 py-2 text-base font-extrabold transition-all ${view === "smart" ? "translate-y-[3px] border-[var(--brand)] bg-[var(--brand-soft)] shadow-[0_1px_0_var(--brand)]" : "border-[var(--line)] bg-white shadow-[0_4px_0_var(--line)]"}`}
          >
            ⭐ {UI[lang].forMe}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "classic"}
            onClick={() => {
              setView("classic");
              setFolder(null);
            }}
            className={`font-display rounded-2xl border-2 py-2 text-base font-extrabold transition-all ${view === "classic" ? "translate-y-[3px] border-[var(--brand)] bg-[var(--brand-soft)] shadow-[0_1px_0_var(--brand)]" : "border-[var(--line)] bg-white shadow-[0_4px_0_var(--line)]"}`}
          >
            📁 {UI[lang].allWords}
          </button>
        </div>
      )}

      <div className="@container flex-1 overflow-y-auto p-2">
        {/* Core words: same place on both boards, always (motor planning). 4 or 8 columns, so the 8 slots never reflow mid-row. */}
        <div className="mb-3 grid grid-cols-4 gap-2 @2xl:grid-cols-8">
          {core.map((t) => (
            <BigTile key={t.id} tile={t} primary={primary} secondary={secondary} labels={settings.labels} size={coreSize} onTap={tap} />
          ))}
        </div>

        {view === "smart" ? (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {(
                [
                  { id: "need", emoji: FOLDER_META.safety.emoji, label: pick(FOLDER_META.safety.title, lang), bg: "var(--c-safety)", edge: "var(--b-safety)" },
                  { id: "words", emoji: "➕", label: UI[lang].moreWords, bg: "var(--c-core)", edge: "var(--b-core)" },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-expanded={drawer === d.id}
                  onClick={() => setDrawer((x) => (x === d.id ? null : d.id))}
                  className={`kid-tile w-full flex-row! py-2! ${drawer === d.id ? "is-pressed" : ""}`}
                  style={{ background: d.bg, ["--edge" as string]: d.edge }}
                >
                  <span aria-hidden className="text-2xl leading-none">{d.emoji}</span>
                  <span className="font-display text-base font-extrabold">{d.label}</span>
                </button>
              ))}
            </div>
            {drawerTiles.length > 0 && (
              <div className="kid-fade mb-3 grid grid-cols-3 gap-2 rounded-2xl bg-white/60 p-2 @2xl:grid-cols-6">
                {drawerTiles.map((t) => (
                  <BigTile key={t.id} tile={t} primary={primary} secondary={secondary} labels={settings.labels} size={coreSize} onTap={tap} />
                ))}
              </div>
            )}
            {actions.length >= 3 && (
              <>
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--muted)]">
                  <span aria-hidden>{FOLDER_META.actions.emoji}</span>
                  {pick(FOLDER_META.actions.title, lang)}
                </div>
                <div className="mb-3 grid grid-cols-3 gap-2 @2xl:grid-cols-6">
                  {actions.map((t) => (
                    <BigTile key={t.id} tile={t} primary={primary} secondary={secondary} labels={settings.labels} size={coreSize} onTap={tap} />
                  ))}
                </div>
              </>
            )}
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--muted)]">
              <span aria-hidden>✨</span>
              {UI[lang].maybeNext}
              {topic.label && (
                <span className="kid-fade ml-auto flex items-center gap-1 rounded-full border border-[var(--line)] bg-white px-2.5 py-0.5 text-[var(--ink)]" title={topic.label.why}>
                  💬 {UI[lang].talkingAbout} <span aria-hidden>{topic.label.emoji}</span> {pick(topic.label.text, lang)}
                </span>
              )}
            </div>
            {/* Keyed per tile, not per tap: tiles that keep their slot stay still; only newcomers fade in. */}
            <div className="grid gap-2" style={grid}>
              {predictions.map((p, i) => (
                <div key={p.tile.id} className="kid-fade" style={{ animationDelay: `${i * 25}ms` }}>
                  <BigTile tile={p.tile} primary={primary} secondary={secondary} labels={settings.labels} size={size} onTap={tap} onInfo={onInfo} />
                </div>
              ))}
            </div>
            {said.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-sm font-bold text-[var(--muted)]">💬 {UI[lang].saidBefore}</div>
                <div className="flex flex-wrap gap-2">
                  {said.slice(0, compact ? 3 : 6).map((s) => (
                    <button key={s.ts} type="button" onClick={() => speak(s.text, lang)} className="chip text-base">
                      🔁 {s.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : openFolder ? (
          <>
            <div className="mb-2 flex items-center gap-2">
              <button type="button" onClick={() => setFolder(null)} className="btn font-display text-lg">
                ⬅ {UI[lang].back}
              </button>
              <span className="text-lg font-extrabold">
                {openFolder.emoji} {pick(openFolder.title, lang)}
              </span>
            </div>
            <div className="grid gap-2" style={grid}>
              {openFolder.tileIds
                .map((id) => board.tiles[id])
                .filter(Boolean)
                .map((t) => (
                  <BigTile key={t.id} tile={t} primary={primary} secondary={secondary} labels={settings.labels} size={size} onTap={tap} onInfo={onInfo} />
                ))}
            </div>
          </>
        ) : (
          <div className="grid gap-2" style={grid}>
            {board.folders.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFolder(f.id)}
                className="kid-tile w-full"
                style={{ minHeight: tileMin(size), background: `var(--c-${f.id})`, ["--edge" as string]: `var(--b-${f.id})` }}
              >
                <span aria-hidden className="text-5xl leading-none">{f.emoji}</span>
                <span className="font-display text-lg font-extrabold leading-tight">{pick(f.title, lang)}</span>
                <span className="text-xs font-semibold opacity-70">📁 {f.tileIds.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
