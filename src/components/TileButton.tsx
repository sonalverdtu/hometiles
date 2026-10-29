"use client";

import type { Lang, Tile } from "@/lib/board/types";
import { pick } from "@/lib/board/vocab";

export type LabelMode = "primary" | "secondary" | "both";

export function TileButton({
  tile,
  primary,
  secondary,
  labelMode,
  onTap,
  onInfo,
}: {
  tile: Tile;
  primary: Lang;
  secondary?: Lang;
  labelMode: LabelMode;
  onTap: (t: Tile) => void;
  onInfo?: (t: Tile) => void;
}) {
  const main = labelMode === "secondary" && secondary ? pick(tile.label, secondary) : pick(tile.label, primary);
  const sub = labelMode === "both" && secondary ? pick(tile.label, secondary) : null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onTap(tile)}
        aria-label={pick(tile.speak, labelMode === "secondary" && secondary ? secondary : primary)}
        className="tile w-full"
        style={{ background: `var(--c-${tile.category})` }}
      >
        {tile.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tile.image.url} alt="" className="h-14 w-14 rounded-lg bg-white/70 object-contain" loading="lazy" />
        ) : (
          <span aria-hidden className="text-4xl leading-none">{tile.emoji}</span>
        )}
        <span className="line-clamp-2 text-[15px] font-bold leading-tight">{main}</span>
        {sub && sub !== main && <span className="line-clamp-1 text-xs text-[var(--muted)]">{sub}</span>}
        {tile.locked && tile.kind === "rotating" && <span className="absolute left-1.5 top-1 text-xs" aria-label="locked">🔒</span>}
      </button>
      {onInfo && (
        <button
          type="button"
          onClick={() => onInfo(tile)}
          className="no-print absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/85 text-xs font-bold shadow-sm hover:bg-white"
          aria-label={`Why this tile: ${tile.label.en}`}
          title="Why this tile?"
        >
          i
        </button>
      )}
    </div>
  );
}
