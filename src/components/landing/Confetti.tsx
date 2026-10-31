"use client";

// A small confetti burst for the landing page demo: when the board speaks a sentence, it celebrates.
// Landing page only; the real child board stays calm.

const COLOURS = ["#ec6233", "#ffc93c", "#0f7b6c", "#6d4fe0", "#e57bb4", "#6fa8dc"];

export interface Burst {
  id: number;
  x: number;
  y: number;
  pieces: { dx: number; dy: number; rot: number; colour: string; w: number; h: number; round: boolean; delay: number; dur: number }[];
}

/** Pieces fly up and outwards from (x, y), then fall. Random, so call it from an event, not during render. */
export function makeBurst(x: number, y: number, count = 34): Burst {
  return {
    id: Date.now() + Math.random(),
    x,
    y,
    pieces: Array.from({ length: count }, () => {
      const angle = (-165 + Math.random() * 150) * (Math.PI / 180);
      const dist = 70 + Math.random() * 150;
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        rot: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360),
        colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 8,
        round: Math.random() < 0.3,
        delay: Math.random() * 0.12,
        dur: 1.1 + Math.random() * 0.5,
      };
    }),
  };
}

export function ConfettiLayer({ bursts }: { bursts: Burst[] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-40 overflow-visible">
      {bursts.map((b) =>
        b.pieces.map((p, i) => (
          <span
            key={`${b.id}-${i}`}
            className="confetti-piece"
            style={{
              left: b.x,
              top: b.y,
              width: p.w,
              height: p.h,
              background: p.colour,
              borderRadius: p.round ? 999 : 2,
              ["--dx" as string]: `${p.dx}px`,
              ["--dy" as string]: `${p.dy}px`,
              ["--rot" as string]: `${p.rot}deg`,
              ["--delay" as string]: `${p.delay}s`,
              ["--dur" as string]: `${p.dur}s`,
            }}
          />
        )),
      )}
    </div>
  );
}
