import type { Ref } from "react";

/**
 * A compact section heading that sits inside a pinned (sticky) frame, so people always see what the
 * scrolling part is about, and the heading, board and text all fit on one screen.
 */
export function PinHead({ eyebrow, title, sub, ref }: { eyebrow: string; title: string; sub?: string; ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className="mx-auto mb-3 max-w-3xl px-1 text-center sm:mb-5">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--brand)]">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-extrabold leading-tight sm:text-4xl">{title}</h2>
      {/* On short screens (laptops at 720 px) the subtitle gives way so the pinned frame still fits. */}
      {sub && <p className="mx-auto mt-1.5 max-w-2xl text-sm leading-snug text-[var(--muted)] sm:text-base [@media(max-height:760px)]:hidden">{sub}</p>}
    </div>
  );
}
