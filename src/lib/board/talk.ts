// Words to talk ABOUT a tile, from Qloo's own tags for it. A place's amenity tags give what you do or need
// there (swing, slide, toilet, picnic), a show's keyword and plot tags give what it's about and what it's
// like (dog, sister, funny), a snack's flavour and context tags give how it is (sweet, share). This is the
// taste graph used for communication: a child can comment, ask and tell, not only name the thing they want.

import type { QTag, QlooType } from "../qloo/types";
import type { Localized } from "./types";

export interface TalkWord {
  label: Localized;
  emoji: string;
  /** ARASAAC pictogram id. */
  picto: number;
}

// Words the board doesn't already have. Tiles that exist (toilet, ball, friend…) are reused instead.
export const TALK_WORDS: Record<string, TalkWord> = {
  slide: { label: { en: "slide", hi: "स्लाइड", es: "tobogán" }, emoji: "🛝", picto: 4759 },
  playground: { label: { en: "playground", hi: "खेल का मैदान", es: "juegos" }, emoji: "🤸", picto: 33064 },
  picnic: { label: { en: "picnic", hi: "पिकनिक", es: "pícnic" }, emoji: "🧺", picto: 10236 },
  boat: { label: { en: "boat", hi: "नाव", es: "barco" }, emoji: "🚣", picto: 6932 },
  animals: { label: { en: "animals", hi: "जानवर", es: "animales" }, emoji: "🦁", picto: 8025 },
  dog: { label: { en: "dog", hi: "कुत्ता", es: "perro" }, emoji: "🐶", picto: 7202 },
  cat: { label: { en: "cat", hi: "बिल्ली", es: "gato" }, emoji: "🐱", picto: 7114 },
  bear: { label: { en: "bear", hi: "भालू", es: "oso" }, emoji: "🐻", picto: 2488 },
  dinosaur: { label: { en: "dinosaur", hi: "डायनासोर", es: "dinosaurio" }, emoji: "🦖", picto: 2738 },
  flowers: { label: { en: "flowers", hi: "फूल", es: "flores" }, emoji: "🌸", picto: 7104 },
  train: { label: { en: "train", hi: "ट्रेन", es: "tren" }, emoji: "🚂", picto: 2603 },
  funny: { label: { en: "funny", hi: "मज़ेदार", es: "chistoso" }, emoji: "😂", picto: 24733 },
  scary: { label: { en: "scary", hi: "डरावना", es: "da miedo" }, emoji: "😱", picto: 35535 },
  superhero: { label: { en: "superhero", hi: "सुपरहीरो", es: "superhéroe" }, emoji: "🦸", picto: 38023 },
  magic: { label: { en: "magic", hi: "जादू", es: "magia" }, emoji: "✨", picto: 10157 },
  space: { label: { en: "space", hi: "अंतरिक्ष", es: "espacio" }, emoji: "🚀", picto: 25074 },
  sea: { label: { en: "sea", hi: "समुद्र", es: "mar" }, emoji: "🌊", picto: 2925 },
  monster: { label: { en: "monster", hi: "राक्षस", es: "monstruo" }, emoji: "👾", picto: 11306 },
  kind: { label: { en: "kind", hi: "दयालु", es: "amable" }, emoji: "🤗", picto: 33994 },
  pretend: { label: { en: "pretend", hi: "खेल-खेल में", es: "imaginar" }, emoji: "🎭", picto: 10368 },
  princess: { label: { en: "princess", hi: "राजकुमारी", es: "princesa" }, emoji: "👸", picto: 5554 },
  family: { label: { en: "family", hi: "परिवार", es: "familia" }, emoji: "👨‍👩‍👧", picto: 38351 },
  chocolate: { label: { en: "chocolate", hi: "चॉकलेट", es: "chocolate" }, emoji: "🍫", picto: 25940 },
  sweet: { label: { en: "sweet", hi: "मीठा", es: "dulce" }, emoji: "🍬", picto: 32440 },
  share: { label: { en: "share", hi: "बाँटना", es: "compartir" }, emoji: "🤲", picto: 38900 },
  crunchy: { label: { en: "crunchy", hi: "कुरकुरा", es: "crujiente" }, emoji: "🥨", picto: 2505 },
  fizzy: { label: { en: "fizzy", hi: "सोडा", es: "con gas" }, emoji: "🫧", picto: 39624 },
  spicy: { label: { en: "spicy", hi: "तीखा", es: "picante" }, emoji: "🌶️", picto: 4719 },
  salty: { label: { en: "salty", hi: "नमकीन", es: "salado" }, emoji: "🧂", picto: 32524 },
};

type Kind = "place" | "screen" | "game" | "brand";
const kindOf = (t: QlooType): Kind | null =>
  t === "urn:entity:place" ? "place"
  : t === "urn:entity:tv_show" || t === "urn:entity:movie" || t === "urn:entity:book" ? "screen"
  : t === "urn:entity:videogame" ? "game"
  : t === "urn:entity:brand" ? "brand"
  : null;

/** A rule maps Qloo tags to a word: a TALK_WORDS key, or `=tile-id` to reuse a tile the board already has. */
interface Rule {
  re: RegExp;
  to: string;
  kinds: Kind[];
  /** Only tags whose id matches this (e.g. keywords and themes, not the "Family" genre every kids' film has). */
  groups?: RegExp;
}

const S: Kind[] = ["screen", "game"];
// In priority order: the most specific, most sayable words first.
const RULES: Rule[] = [
  // What you do or need at a place (amenities, activities, children, pets, ambience).
  { re: /\bswings?\b/, to: "=basic-swing", kinds: ["place"] },
  { re: /\bslides?\b/, to: "slide", kinds: ["place"] },
  { re: /playground/, to: "playground", kinds: ["place"] },
  { re: /restroom|toilet|nappy|baby[ _]chang/, to: "=safety-toilet", kinds: ["place"] },
  { re: /picnic/, to: "picnic", kinds: ["place"] },
  { re: /\bboat/, to: "boat", kinds: ["place"] },
  { re: /\bzoo\b|animal|wildlife|aquarium|petting/, to: "animals", kinds: ["place"] },
  { re: /dogs?[ _]allowed|dog[ _]park/, to: "dog", kinds: ["place"] },
  { re: /ice[ _]cream|gelato/, to: "=basic-icecream", kinds: ["place"] },
  { re: /garden|flower/, to: "flowers", kinds: ["place"] },
  { re: /\btrain|railway/, to: "train", kinds: ["place", "screen"] },
  { re: /pitch|football|soccer|basketball|tennis/, to: "=basic-ball", kinds: ["place"] },
  { re: /cycling|\bbikes?\b/, to: "=basic-bike", kinds: ["place"] },
  { re: /gift[ _]shop|toy[ _]store/, to: "=basic-shop", kinds: ["place"] },
  { re: /quiet|relaxing|tranquil|serene|peaceful/, to: "=basic-quiet", kinds: ["place"], groups: /ambience|noise/ },
  { re: /lively|noisy|loud|bustling/, to: "=basic-loud", kinds: ["place"], groups: /ambience|noise/ },
  { re: /outdoor[ _]seating|\boutdoors?\b/, to: "=basic-outside", kinds: ["place"] },
  // What a show, film or game is about, and what it's like.
  { re: /pupp|\bdogs?\b|cattle[ _]dog/, to: "dog", kinds: S },
  { re: /\bcats?\b|kitten/, to: "cat", kinds: S },
  { re: /\bbears?\b/, to: "bear", kinds: S },
  { re: /dinosaur/, to: "dinosaur", kinds: S },
  { re: /superhero|super[ _]hero/, to: "superhero", kinds: S },
  { re: /princess/, to: "princess", kinds: S },
  { re: /monster|creeper|zombie/, to: "monster", kinds: S },
  { re: /outer[ _]space|astronaut|rocket|spaceship|planets?\b/, to: "space", kinds: S },
  { re: /ocean|\bsea\b|underwater|marine/, to: "sea", kinds: S },
  { re: /sibling|father|mother|parent/, to: "family", kinds: S, groups: /keyword|theme|archetype/ },
  { re: /friendship|\bfriends?\b/, to: "=basic-friend", kinds: S, groups: /keyword|theme|archetype/ },
  { re: /humou?r|comed|funny|silly|slapstick/, to: "funny", kinds: S },
  { re: /scary|horror|spooky|frighten/, to: "scary", kinds: S },
  { re: /magic|wizard|fairy/, to: "magic", kinds: S },
  { re: /kindness|compassion|empath/, to: "kind", kinds: S, groups: /theme|character|keyword/ },
  { re: /imaginati|pretend|make[ _]believe/, to: "pretend", kinds: S, groups: /theme|keyword|archetype/ },
  { re: /musical|\bsongs?\b|singing/, to: "=basic-sing", kinds: S },
  { re: /danc/, to: "=basic-dance", kinds: S },
  { re: /building|sandbox|construction|\bblocks?\b|blocky/, to: "=basic-blocks", kinds: S },
  { re: /racing|race[ _]car|\bcars?\b/, to: "=basic-toycar", kinds: S },
  { re: /\bschool/, to: "=basic-school", kinds: S, groups: /keyword|theme|setting/ },
  { re: /anthropomorph|\banimals?\b|wildlife/, to: "animals", kinds: S },
  // How a snack or drink is (flavour, how it's eaten).
  { re: /chocolate|cocoa/, to: "chocolate", kinds: ["brand"] },
  { re: /candy|confection|\bsweet\b|sugar/, to: "sweet", kinds: ["brand"] },
  { re: /shar(e|ing)|communal/, to: "share", kinds: ["brand"] },
  { re: /crunch|\bcrisps?\b|\bchips\b/, to: "crunchy", kinds: ["brand"] },
  { re: /(?<!non[ _-])carbonated|fizzy|\bsoda\b/, to: "fizzy", kinds: ["brand"], groups: /genre:brand|flavor|keyword/ },
  { re: /spic|chil+i/, to: "spicy", kinds: ["brand"] },
  { re: /salty|savou?ry/, to: "salty", kinds: ["brand"] },
  { re: /frozen|ice[ _]cream/, to: "=basic-cold", kinds: ["brand"], groups: /genre:brand|keyword|product_category/ },
  { re: /fruit/, to: "=basic-fruit", kinds: ["brand"] },
];

export const MAX_TALK = 6;

/** The talk words for one entity, from its Qloo tags: TALK_WORDS keys and `=tile-id` reuses, best first. */
export function talkFor(type: QlooType, tags: QTag[], avoid: (word: string) => boolean = () => false): string[] {
  const kind = kindOf(type);
  if (!kind || !tags.length) return [];
  // Taste words only for food and drink brands: a toy maker's "Soda" collectibles line isn't fizzy.
  if (kind === "brand" && !tags.some((t) => /food_and_beverage/.test(t.id))) return [];
  // keyword:media tags are scene-level trivia ("Saturn V rocket model" in Peter Rabbit); Qloo's curated
  // keywords, themes and plot tags say what a show is really about.
  const text = tags
    .filter((t) => !/keyword:media/.test(t.id))
    .map((t) => ({ id: t.id.toLowerCase(), s: `${t.id} ${t.name}`.toLowerCase() }));
  const out: string[] = [];
  for (const r of RULES) {
    if (out.length >= MAX_TALK) break;
    if (!r.kinds.includes(kind) || out.includes(r.to)) continue;
    const word = r.to.startsWith("=") ? r.to.slice(1).replace(/^(basic|safety)-/, "") : r.to;
    if (avoid(word)) continue;
    if (text.some((t) => (!r.groups || r.groups.test(t.id)) && r.re.test(t.s))) out.push(r.to);
  }
  // Qloo can tag a place both relaxing and lively; then neither word says anything.
  if (out.includes("=basic-quiet") && out.includes("=basic-loud")) return out.filter((w) => w !== "=basic-quiet" && w !== "=basic-loud");
  return out;
}

/** "dogs, loud places" → a test for words the family wants kept off the board. */
export function avoider(dislikes: string[] | undefined): (text: string) => boolean {
  const words = (dislikes ?? [])
    .flatMap((d) => d.toLowerCase().split(/[^a-z0-9ऀ-ॿáéíóúñ]+/))
    .filter((w) => w.length > 2 && !["the", "and", "places", "place", "things"].includes(w))
    .map((w) => w.replace(/(ies)$/, "y").replace(/s$/, ""));
  if (!words.length) return () => false;
  return (text: string) => {
    const t = text.toLowerCase();
    return words.some((w) => new RegExp(`\\b${w}`).test(t));
  };
}
