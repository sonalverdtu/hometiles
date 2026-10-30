"use client";

import { useState } from "react";
import type { Board, Lang, Suggestion } from "@/lib/board/types";
import { pick } from "@/lib/board/vocab";
import { Modal } from "./Modal";

const ACTION: Record<Suggestion["action"], { icon: string; text: string }> = {
  add: { icon: "➕", text: "Add" },
  replace: { icon: "🔁", text: "Replace" },
  move: { icon: "↖️", text: "Move to front" },
};

export function RefreshDialog({
  board,
  lang,
  counts,
  suggestions,
  seededBy,
  loading,
  onApply,
  onClose,
}: {
  board: Board;
  lang: Lang;
  counts: Record<string, number>;
  suggestions: Suggestion[];
  seededBy: string[];
  loading: boolean;
  onApply: (accepted: Suggestion[]) => void;
  onClose: () => void;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const isOn = (id: string) => checked[id] ?? true;
  const top = Object.entries(counts)
    .filter(([id]) => board.tiles[id])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return (
    <Modal title="Weekly refresh: you approve every change" onClose={onClose} wide>
      <div className="grid gap-4 md:grid-cols-[1fr_1.6fr]">
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--muted)]">Most tapped this week</h3>
          <ol className="space-y-1">
            {top.map(([id, n]) => (
              <li key={id} className="flex items-center gap-2 rounded-lg bg-[#f7f2ea] px-2 py-1 text-sm">
                <span aria-hidden>{board.tiles[id].emoji}</span>
                {pick(board.tiles[id].label, lang)}
                <span className="ml-auto font-mono text-xs">{n}×</span>
              </li>
            ))}
            {!top.length && <li className="text-sm text-[var(--muted)]">No taps logged yet.</li>}
          </ol>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Taps stay on this device. To find new tiles, only tile names, Qloo IDs, tap counts, city, age group and favourites were sent: no names, sentences or tap history. Core, safety and family tiles are never changed.
          </p>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--muted)]">
            Suggested changes {seededBy.length > 0 && <span className="normal-case">· seeded by {seededBy.join(", ")}</span>}
          </h3>
          {loading && <p className="text-sm">The agent is looking for what to add, using this week&apos;s taps…</p>}
          {!loading && !suggestions.length && <p className="text-sm">Nothing to change this week. The board fits.</p>}
          <ul className="space-y-2">
            {suggestions.map((s) => {
              const target = s.targetTileId ? board.tiles[s.targetTileId] : undefined;
              return (
                <li key={s.id} className="rounded-xl border border-[var(--line)] p-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" className="mt-1 h-5 w-5" checked={isOn(s.id)} onChange={(e) => setChecked((c) => ({ ...c, [s.id]: e.target.checked }))} />
                    <span className="text-[15px] leading-snug">
                      <strong>
                        {ACTION[s.action].icon} {ACTION[s.action].text}
                      </strong>{" "}
                      {s.action !== "add" && target && <>“{pick(target.label, lang)}”</>}
                      {s.tile && (
                        <>
                          {s.action === "replace" ? " → " : " "}
                          <span className="rounded px-1.5 py-0.5" style={{ background: `var(--c-${s.tile.category})` }}>
                            {s.tile.emoji} {pick(s.tile.label, lang)}
                          </span>
                        </>
                      )}
                      <span className="block text-sm text-[var(--muted)]">{s.reason}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-primary" disabled={loading || !suggestions.length} onClick={() => onApply(suggestions.filter((s) => isOn(s.id)))}>
              ✅ Approve selected
            </button>
            <button type="button" className="btn" onClick={onClose}>Not now</button>
          </div>
        </section>
      </div>
    </Modal>
  );
}
