"use client";

import { useState } from "react";
import type { Lang, Reason, Tile } from "@/lib/board/types";
import { tileSpeech } from "@/lib/board/sentence";
import { BigTile } from "./kid/BigTile";
import { Modal } from "./Modal";
import { Sparkline } from "./Sparkline";

const KIND: Record<Reason["kind"], { icon: string; title: string; bg: string }> = {
  personal: { icon: "💜", title: "Matches what they love", bg: "var(--grape-soft)" },
  temperament: { icon: "🧩", title: "Fits what they're like", bg: "var(--c-fun)" },
  local: { icon: "📍", title: "Near home", bg: "var(--c-places)" },
  age: { icon: "🎂", title: "Right for their age", bg: "var(--c-core)" },
  audience: { icon: "👥", title: "Who enjoys it", bg: "var(--c-people)" },
  shared: { icon: "🤝", title: "Something to share", bg: "var(--c-together)" },
  trending: { icon: "📈", title: "Rising right now", bg: "var(--brand-soft)" },
  core: { icon: "⭐", title: "Core word", bg: "var(--c-core)" },
  safety: { icon: "🛟", title: "Safety word", bg: "var(--c-safety)" },
  people: { icon: "👪", title: "Family", bg: "var(--c-people)" },
  usage: { icon: "👆", title: "From real taps", bg: "var(--c-fun)" },
};

const PARTNER: Record<string, string> = { friends: "Great with cousins and friends", elders: "Great with grandparents", everyone: "Everyone can join in" };

const REMOVE_REASONS = ["Misleading", "Not relevant to my child", "Not appropriate", "They don't like it", "Wrong place / too far", "Other"];

export function WhyDialog({
  tile,
  lang,
  onClose,
  onToggleLock,
  onRemove,
}: {
  tile: Tile;
  lang: Lang;
  onClose: () => void;
  onToggleLock: (t: Tile) => void;
  /** Parent removes the tile; `reason` is the chosen reason plus any note. */
  onRemove?: (t: Tile, reason: string) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [why, setWhy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const removable = !!onRemove && tile.kind !== "core" && tile.kind !== "safety";
  const label = tileSpeech(tile, lang);
  return (
    <Modal title="Why is this tile here?" onClose={onClose}>
      <div className="mb-4 flex items-center gap-4 rounded-2xl bg-[var(--surface-2)] p-3">
        <div className="w-28 shrink-0">
          <BigTile tile={tile} primary={lang} labels="primary" size="m" onTap={() => {}} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">When tapped it says</p>
          <p className="font-display text-xl font-extrabold leading-tight">“{tileSpeech(tile, lang)}”</p>
          {tile.partner && <p className="mt-1 text-sm font-semibold text-[var(--accent)]">👥 {PARTNER[tile.partner]}</p>}
        </div>
      </div>

      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">What the agent found in Qloo</p>
      <ul className="space-y-2">
        {tile.reasons.map((r, i) => {
          const k = KIND[r.kind] ?? KIND.personal;
          return (
            <li key={i} className="fade-up flex items-start gap-3 rounded-2xl border border-[var(--line)] p-3" style={{ animationDelay: `${i * 70}ms` }}>
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl" style={{ background: k.bg }}>
                {k.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold">{k.title}</span>
                <span className="block text-[15px] leading-snug text-[#3c3a48]">{r.text}</span>
              </span>
            </li>
          );
        })}
      </ul>

      {tile.trend && tile.trend.length > 1 && (
        <div className="mt-3 rounded-2xl border border-[var(--line)] p-3">
          <p className="text-xs text-[var(--muted)]">Popularity percentile, week by week (Qloo trending)</p>
          <Sparkline values={tile.trend} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {tile.kind === "rotating" && (
          <button type="button" className="btn" onClick={() => onToggleLock(tile)}>
            {tile.locked ? "🔓 Allow weekly changes" : "🔒 Keep this tile forever"}
          </button>
        )}
        {removable && !removing && (
          <button type="button" className="btn border-[#f3b0a0] text-[#b42318]" onClick={() => setRemoving(true)}>
            🗑️ Remove this tile
          </button>
        )}
        {tile.entity?.qlooId && (
          <p className="font-mono text-[11px] text-[var(--muted)]">
            Qloo entity {tile.entity.qlooId.slice(0, 13)}…
            {tile.score !== undefined ? ` · score ${tile.score.toFixed(2)}` : ""}
          </p>
        )}
      </div>

      {removable && removing && (
        <div className="fade-up mt-4 rounded-2xl border-2 border-[#f3b0a0] bg-[#fff6f3] p-4">
          <p className="font-display text-lg font-extrabold">Why remove “{label}”?</p>
          <p className="mb-3 text-sm text-[var(--muted)]">Your reason is kept in the board notes, and the weekly refresh won&apos;t suggest it again.</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Reason">
            {REMOVE_REASONS.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={why === r} onClick={() => setWhy(r)} className="chip text-sm">
                {r}
              </button>
            ))}
          </div>
          <input
            className="input mt-3 text-sm"
            placeholder="Add a note (optional)"
            aria-label="Note"
            maxLength={120}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => setRemoving(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn ml-auto"
              disabled={!why}
              style={{ ["--btn-face" as string]: "linear-gradient(180deg,#e5484d 0%,#c22a2f 100%)", ["--btn-edge" as string]: "#86161a", ["--btn-ink" as string]: "#fff", borderColor: "#a31d22" }}
              onClick={() => why && onRemove?.(tile, note.trim() ? `${why}: ${note.trim()}` : why)}
            >
              🗑️ Remove “{label}”
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
