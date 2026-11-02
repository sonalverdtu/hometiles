// The HomeTiles mark: a house that talks (roof and walls with a speech-bubble tail), with four picture
// tiles as its window. Same drawing as src/app/icon.svg, so the favicon and the page always match.

const TILES = [
  { x: 16.5, y: 28.5, fill: "var(--brand)" },
  { x: 32.9, y: 28.5, fill: "var(--sun)" },
  { x: 16.5, y: 39.7, fill: "var(--accent)" },
  { x: 32.9, y: 39.7, fill: "var(--grape)" },
];

/** `pulse` makes the window tiles pop one after another (used while a board is being built). */
export function BrandMark({ size = 36, className = "", pulse = false }: { size?: number; className?: string; pulse?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 64 64" width={size} height={size} className={className}>
      <path
        d="M32 3 L59 24.5 Q61 26.3 58.5 27 L56.5 27 L56.5 52.5 Q56.5 56.5 52.5 56.5 L27.5 56.5 L15 62.8 Q13.2 63.6 14 61.8 L16.3 56.5 L11.5 56.5 Q7.5 56.5 7.5 52.5 L7.5 27 L5.5 27 Q3 26.3 5 24.5 Z"
        fill="var(--brand)"
      />
      <rect x="13.5" y="25.5" width="37" height="27.5" rx="6" fill="#fff8ef" />
      {TILES.map((t, k) => (
        <rect
          key={k}
          x={t.x}
          y={t.y}
          width="14.6"
          height="10.3"
          rx="2.8"
          fill={t.fill}
          style={pulse ? { transformBox: "fill-box", transformOrigin: "center", animation: `kidPop 1.2s ${k * 0.3}s ease-in-out infinite` } : undefined}
        />
      ))}
    </svg>
  );
}
