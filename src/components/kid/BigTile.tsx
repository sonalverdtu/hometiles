"use client";

import { useState } from "react";
import type { Lang, Tile } from "@/lib/board/types";
import { pick } from "@/lib/board/vocab";

export type TileSize = "xs" | "s" | "m" | "l" | "xl";
export type LabelMode = "primary" | "secondary" | "both";

const SIZE: Record<TileSize, { min: string; icon: string; text: string; img: string }> = {
  xs: { min: "4.1rem", icon: "text-2xl", text: "text-[13px]", img: "h-8 w-8" },
  s: { min: "5.2rem", icon: "text-3xl", text: "text-[13px]", img: "h-10 w-10" },
  m: { min: "6.5rem", icon: "text-4xl", text: "text-[15px]", img: "h-12 w-12" },
  l: { min: "8rem", icon: "text-5xl", text: "text-lg", img: "h-16 w-16" },
  xl: { min: "10rem", icon: "text-6xl", text: "text-xl", img: "h-20 w-20" },
};

export function tileMin(size: TileSize) {
  return SIZE[size].min;
}

export function BigTile({
  tile,
  primary,
  secondary,
  labels,
  size = "l",
  onTap,
  onInfo,
  highlight,
}: {
  tile: Tile;
  primary: Lang;
  secondary?: Lang;
  labels: LabelMode;
  size?: TileSize;
  onTap: (t: Tile) => void;
  onInfo?: (t: Tile) => void;
  highlight?: boolean;
}) {
  const s = SIZE[size];
  const [broken, setBroken] = useState(false);
  const mainLang = labels === "secondary" && secondary ? secondary : primary;
  const main = pick(tile.label, mainLang);
  const sub = labels === "both" && secondary ? pick(tile.label, secondary) : null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onTap(tile)}
        aria-label={pick(tile.speak, mainLang)}
        className={`kid-tile w-full ${highlight ? "kid-tile-pop" : ""}`}
        style={{ minHeight: s.min, background: `var(--c-${tile.category})`, borderColor: `var(--b-${tile.category})` }}
      >
        {tile.image && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tile.image.url} alt="" className={`${s.img} rounded-xl bg-white/80 object-contain`} loading="lazy" draggable={false} onError={() => setBroken(true)} />
        ) : (
          <span aria-hidden className={`${s.icon} leading-none`}>{tile.emoji}</span>
        )}
        <span className={`line-clamp-2 font-bold leading-tight ${s.text}`}>{main}</span>
        {sub && sub !== main && <span className="line-clamp-1 text-xs font-medium opacity-70">{sub}</span>}
      </button>
      {onInfo && tile.kind === "rotating" && (
        <button
          type="button"
          onClick={() => onInfo(tile)}
          className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-xs font-bold shadow-sm hover:bg-white"
          aria-label={`Why this tile: ${tile.label.en}`}
          title="Why this tile?"
        >
          i
        </button>
      )}
    </div>
  );
}
