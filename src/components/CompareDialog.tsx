"use client";

import { useEffect, useState } from "react";
import type { Board, Lang } from "@/lib/board/types";
import { pick } from "@/lib/board/vocab";
import { Modal } from "./Modal";

interface BaselineTile {
  category: "food" | "places" | "favourites";
  label: string;
  labelPrimary?: string;
}

const CATS: { id: "favourites" | "food" | "places"; title: string }[] = [
  { id: "favourites", title: "Favourites" },
  { id: "food", title: "Food & snacks" },
  { id: "places", title: "Places" },
];

export function CompareDialog({ board, lang, onClose }: { board: Board; lang: Lang; onClose: () => void }) {
  const [base, setBase] = useState<{ tiles: BaselineTile[]; source: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/baseline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: board.profile }) })
      .then((r) => r.json())
      .then((j) => (j.tiles ? setBase(j) : setErr(j.error ?? "Failed")))
      .catch((e) => setErr(String(e)));
  }, [board.profile]);

  const ours = (cat: string) => (board.folders.find((f) => f.id === cat)?.tileIds ?? []).map((id) => board.tiles[id]).filter(Boolean);
  const allOurs = CATS.flatMap((c) => ours(c.id));
  const grounded = allOurs.filter((t) => t.entity?.qlooId).length;
  const nearby = ours("places").filter((t) => t.entity?.distanceM !== undefined);
  const avgDist = nearby.length ? Math.round(nearby.reduce((s, t) => s + (t.entity?.distanceM ?? 0), 0) / nearby.length) : null;

  return (
    <Modal title="With vs without Qloo" onClose={onClose} wide>
      <p className="mb-4 text-sm text-[var(--muted)]">
        Same intake, two boards. On the left: a generic AI answer with no taste data
        {base?.source === "mock" ? " (mock stand-in: add an Anthropic key to generate it live)" : ""}. On the right: HomeTiles, grounded in Qloo.
      </p>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <Stat big={`${grounded}/${allOurs.length}`} text="tiles backed by Qloo evidence (vs 0)" />
        <Stat big={`${nearby.length}`} text={`real places near home${avgDist !== null ? `, avg ${avgDist} m away` : ""} (vs generic 'park', 'mall')`} />
        <Stat big={`${board.trace.length}`} text="Qloo calls behind the board" />
      </div>
      {err && <p role="alert" className="text-red-700">{err}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] p-3">
          <h3 className="mb-2 font-bold">Without Qloo</h3>
          {!base && !err && <p className="text-sm text-[var(--muted)]">Asking a plain AI…</p>}
          {base &&
            CATS.map((c) => (
              <div key={c.id} className="mb-3">
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{c.title}</div>
                <div className="flex flex-wrap gap-1.5">
                  {base.tiles.filter((t) => t.category === c.id).map((t, i) => (
                    <span key={i} className="rounded-lg bg-[#f1f1f1] px-2 py-1 text-sm">{t.labelPrimary && lang !== "en" ? t.labelPrimary : t.label}</span>
                  ))}
                </div>
              </div>
            ))}
        </div>
        <div className="rounded-2xl border-2 border-[var(--accent)] p-3">
          <h3 className="mb-2 font-bold text-[var(--accent)]">HomeTiles with Qloo</h3>
          {CATS.map((c) => (
            <div key={c.id} className="mb-3">
              <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{c.title}</div>
              <div className="flex flex-wrap gap-1.5">
                {ours(c.id).map((t) => (
                  <span key={t.id} className="rounded-lg px-2 py-1 text-sm" style={{ background: `var(--c-${t.category})` }} title={t.reasons[0]?.text}>
                    {t.emoji} {pick(t.label, lang)}
                    {t.entity?.distanceM !== undefined && <span className="text-xs text-[var(--muted)]"> · {t.entity.distanceM} m</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function Stat({ big, text }: { big: string; text: string }) {
  return (
    <div className="rounded-xl bg-[#f4efe7] p-3">
      <div className="text-2xl font-extrabold">{big}</div>
      <div className="text-xs text-[var(--muted)]">{text}</div>
    </div>
  );
}
