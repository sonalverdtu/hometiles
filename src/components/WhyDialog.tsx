"use client";

import type { Lang, Tile } from "@/lib/board/types";
import { pick } from "@/lib/board/vocab";
import { Modal } from "./Modal";
import { Sparkline } from "./Sparkline";

const KIND_ICON: Record<string, string> = {
  personal: "💜",
  local: "📍",
  age: "🎂",
  audience: "👥",
  shared: "🤝",
  trending: "📈",
  core: "⭐",
  safety: "🛟",
  people: "👪",
  usage: "👆",
};

const PARTNER: Record<string, string> = { friends: "Great with cousins and friends", elders: "Great with grandparents", everyone: "Everyone can join in" };

export function WhyDialog({ tile, lang, onClose, onToggleLock }: { tile: Tile; lang: Lang; onClose: () => void; onToggleLock: (t: Tile) => void }) {
  return (
    <Modal title={`Why "${pick(tile.label, lang)}"?`} onClose={onClose}>
      <p className="mb-3 rounded-xl bg-[#f7f2ea] px-3 py-2 text-sm">
        Says: <strong>{pick(tile.label, lang)}</strong>
      </p>
      <ul className="space-y-2">
        {tile.reasons.map((r, i) => (
          <li key={i} className="flex gap-2 text-[15px] leading-snug">
            <span aria-hidden>{KIND_ICON[r.kind] ?? "•"}</span>
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
      {tile.partner && <p className="mt-3 text-sm font-semibold text-[var(--accent)]">👥 {PARTNER[tile.partner]}</p>}
      {tile.trend && tile.trend.length > 1 && (
        <div className="mt-3">
          <p className="text-xs text-[var(--muted)]">Popularity percentile, last 8 weeks (Qloo trending)</p>
          <Sparkline values={tile.trend} />
        </div>
      )}
      {tile.entity?.qlooId && (
        <p className="mt-3 font-mono text-xs text-[var(--muted)]">
          Qloo entity: {tile.entity.qlooId}
          {tile.score !== undefined ? ` · board score ${tile.score.toFixed(2)}` : ""}
        </p>
      )}
      {tile.kind === "rotating" && (
        <button type="button" className="btn mt-4" onClick={() => onToggleLock(tile)}>
          {tile.locked ? "🔓 Unlock (allow weekly changes)" : "🔒 Lock (never change automatically)"}
        </button>
      )}
    </Modal>
  );
}
