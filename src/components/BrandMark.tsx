// The HomeTiles mark: a little bird whose body is a speech bubble, beak open mid-word. It is the child's
// voice. Same drawing as src/app/icon.svg, so the favicon and the page always match.

/** `pulse` makes the bird talk (beak opens and closes) while a board is being built. */
export function BrandMark({ size = 36, className = "", pulse = false }: { size?: number; className?: string; pulse?: boolean }) {
  const talk = pulse ? { transformBox: "fill-box" as const, transformOrigin: "left center", animation: "birdTalk 0.9s ease-in-out infinite" } : undefined;
  return (
    <svg aria-hidden viewBox="0 0 64 64" width={size} height={size} className={className}>
      <path d="M27.5 11 C24.5 8 25 3.5 28.5 3.2 C31 3 31.6 6.5 31 11 Z" fill="#4f6bed" />
      <path d="M31.5 11 C31.5 6.5 34.5 4 37.5 5.2 C40.2 6.4 38.6 10 35.2 12 Z" fill="#4f6bed" />
      <path
        d="M29 10 C43.5 10 53.5 19.5 53.5 33.5 C53.5 47.5 43.5 56.5 29 56.5 C25.6 56.5 22.5 56 19.7 55 L8.8 60.7 C7.4 61.4 6.4 60.2 7.2 59 L11.6 51.7 C7.6 47.4 5 41 5 33.5 C5 19.5 14.5 10 29 10 Z"
        fill="#4f6bed"
      />
      <path d="M51.8 25.5 L62.3 29.6 Q63.6 30.2 62.3 30.8 L52.6 33.4 Z" fill="#ffb020" />
      <path d="M52.6 35.8 L60.6 38.6 Q61.8 39.1 60.6 39.7 L51.8 42.6 Z" fill="#f08a00" style={talk} />
      <circle cx="38" cy="25.5" r="6.6" fill="#fff" />
      <circle cx="39.7" cy="25.7" r="3.4" fill="#1d1b26" />
      <circle cx="40.8" cy="24.4" r="1.15" fill="#fff" />
      <path d="M12.5 33 C20 31 30 34.5 33.5 42 C27 46.5 16.5 44.5 12.5 33 Z" fill="#8ea2ff" />
    </svg>
  );
}
