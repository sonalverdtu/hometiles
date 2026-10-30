// What the board says out loud. Like Cboard (vocalizeTile: `tile.vocalization || tile.label`), a tap says
// exactly the label shown on the tile, nothing extra. The Speak button says one sentence built only from
// the tiles in the sentence bar, and the bar shows that exact sentence before it is spoken.

import type { Lang, Tile } from "./types";
import { pick } from "./vocab";

type Verb = Record<Lang, (thing: string) => string>;

// Grammar for the common request patterns, so "I + want + Parle-G" is correct Hindi word order.
const VERBS: Record<string, Verb> = {
  "core-want": { en: (x) => `I want ${x}`, hi: (x) => `मुझे ${x} चाहिए`, es: (x) => `Quiero ${x}` },
  "core-go": { en: (x) => `I want to go to ${x}`, hi: (x) => `मुझे ${x} जाना है`, es: (x) => `Quiero ir a ${x}` },
  "core-eat": { en: (x) => `I want to eat ${x}`, hi: (x) => `मुझे ${x} खाना है`, es: (x) => `Quiero comer ${x}` },
  "core-play": { en: (x) => `I want to play ${x}`, hi: (x) => `मुझे ${x} खेलना है`, es: (x) => `Quiero jugar ${x}` },
  "core-like": { en: (x) => `I like ${x}`, hi: (x) => `मुझे ${x} पसंद है`, es: (x) => `Me gusta ${x}` },
};

/** What a single tap says: the label on the tile. */
export function tileSpeech(tile: Tile, lang: Lang): string {
  return pick(tile.label, lang);
}

/**
 * The sentence the Speak button will say (and the bar previews).
 * [I] + verb + one thing [+ please] → a grammatical sentence; anything else → the labels in order.
 */
export function composeSentence(tiles: Tile[], lang: Lang): string {
  if (!tiles.length) return "";
  const rest = tiles.filter((t) => t.id !== "core-i" && t.id !== "core-please");
  const hasPlease = tiles.some((t) => t.id === "core-please");
  if (rest.length === 2 && VERBS[rest[0].id] && rest[1].kind !== "core") {
    const please = hasPlease ? ` ${pick(tiles.find((t) => t.id === "core-please")!.label, lang)}` : "";
    return VERBS[rest[0].id][lang](pick(rest[1].label, lang)) + please;
  }
  return tiles.map((t) => pick(t.label, lang)).join(" ");
}
