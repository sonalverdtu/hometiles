"use client";

import { useState } from "react";
import type { Lang, Tile } from "@/lib/board/types";
import { pick } from "@/lib/board/vocab";

export type TileSize = "xs" | "s" | "m" | "l" | "xl";
export type LabelMode = "primary" | "secondary" | "both";

const SIZE: Record<TileSize, { min: string; icon: string; text: string; img: string }> = {
  xs: { min: "4.1rem", icon: "text-2xl", text: "text-[14px]", img: "h-8 w-8" },
  s: { min: "5.2rem", icon: "text-3xl", text: "text-[14px]", img: "h-10 w-10" },
  m: { min: "6.5rem", icon: "text-4xl", text: "text-base", img: "h-12 w-12" },
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
  pressed,
}: {
  tile: Tile;
  primary: Lang;
  secondary?: Lang;
  labels: LabelMode;
  size?: TileSize;
  onTap: (t: Tile) => void;
  onInfo?: (t: Tile) => void;
  highlight?: boolean;
  /** Shows the pushed-down state without a real tap (the landing page demo hand). */
  pressed?: boolean;
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
        onContextMenu={(e) => e.preventDefault()}
        aria-label={main}
        className={`kid-tile w-full ${highlight ? "kid-tile-pop" : ""} ${pressed ? "is-pressed" : ""}`}
        style={{ minHeight: s.min, background: `var(--c-${tile.category})`, ["--edge" as string]: `var(--b-${tile.category})` }}
      >
        {/* Emoji and pictures share one box size, so tiles in a row line up. */}
        {tile.image && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tile.image.url} alt="" className={`${s.img} rounded-xl bg-white/80 object-contain`} loading="lazy" draggable={false} onError={() => setBroken(true)} />
        ) : (
          <span aria-hidden className={`${s.img} ${s.icon} grid place-items-center leading-none`}>{tile.emoji}</span>
        )}
        <span className={`font-display line-clamp-2 font-bold leading-tight ${s.text}`}>{main}</span>
        {sub && sub !== main && <span className="line-clamp-1 text-xs font-medium opacity-70">{sub}</span>}
      </button>
      {onInfo && tile.kind === "rotating" && (
        <button
          type="button"
          onClick={() => onInfo(tile)}
          className="absolute -right-1.5 -top-1.5 z-10 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[var(--grape)] text-sm font-extrabold text-white shadow-[0_3px_0_#4a33a8] transition-transform hover:scale-110 active:translate-y-0.5"
          aria-label={`Why this tile: ${tile.label.en}`}
          title="Why this tile?"
        >
          ?
        </button>
      )}
    </div>
  );
}
