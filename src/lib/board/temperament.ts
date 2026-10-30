// What a child is like, turned into Qloo tags. Qloo does not model a child's personality and has no
// child audiences (tested live); what it does have is descriptors on shows and films ("calm", "energetic",
// "shy" characters...). Sent as signal.interests.tags with a union operator, they clearly shift TV and
// movie results (calm → Franklin, In the Night Garden; energetic → Horrid Henry, Slugterra). They barely
// move games or music, so the board only uses them for shows and films, as one extra, lighter signal.

export const TEMPERAMENTS = ["energetic", "calm", "shy", "curious", "sporty", "creative", "funny"] as const;
export type Temperament = (typeof TEMPERAMENTS)[number];

// `adj` reads in a sentence: "an energetic and funny child".
export const TEMPERAMENT: Record<Temperament, { label: string; adj: string; emoji: string; hint: string; tags: string[]; mock: string[] }> = {
  energetic: {
    label: "Full of energy",
    adj: "energetic",
    emoji: "⚡",
    hint: "Always on the go, a bit cheeky",
    tags: ["urn:tag:style:qloo:energetic", "urn:tag:character:qloo:energetic", "urn:tag:plot:qloo:action_packed", "urn:tag:character:qloo:mischievous"],
    mock: ["adventure", "superhero", "comedy"],
  },
  calm: {
    label: "Calm and gentle",
    adj: "calm",
    emoji: "🌙",
    hint: "Likes things slow and quiet",
    tags: ["urn:tag:style:qloo:calm", "urn:tag:style:qloo:gentle", "urn:tag:style:qloo:soothing"],
    mock: ["toddler", "learning", "family-film"],
  },
  shy: {
    label: "Shy",
    adj: "shy",
    emoji: "🐢",
    hint: "Warms up slowly to new people",
    tags: ["urn:tag:character:qloo:shy", "urn:tag:character:qloo:timid", "urn:tag:style:qloo:gentle", "urn:tag:plot:qloo:heartwarming"],
    mock: ["toddler", "family-film", "family-comedy"],
  },
  curious: {
    label: "Curious",
    adj: "curious",
    emoji: "🔍",
    hint: "Asks why, loves finding out",
    tags: ["urn:tag:style:qloo:educational", "urn:tag:character:qloo:curious", "urn:tag:audience:qloo:curious"],
    mock: ["learning", "science", "adventure"],
  },
  sporty: {
    label: "Sporty",
    adj: "sporty",
    emoji: "⚽",
    hint: "Loves running, kicking, racing",
    tags: ["urn:tag:subgenre:qloo:sports", "urn:tag:keyword:qloo:sports", "urn:tag:character:qloo:athletic"],
    mock: ["soccer", "cricket", "gaming-racing"],
  },
  creative: {
    label: "Creative",
    adj: "creative",
    emoji: "🎨",
    hint: "Draws, builds, sings, imagines",
    tags: ["urn:tag:style:qloo:creative", "urn:tag:style:qloo:imaginative", "urn:tag:plot:qloo:musical"],
    mock: ["music-film", "kids-songs", "gaming-sandbox"],
  },
  funny: {
    label: "Silly and funny",
    adj: "funny",
    emoji: "🤪",
    hint: "Loves jokes and slapstick",
    tags: ["urn:tag:style:qloo:silly", "urn:tag:plot:qloo:funny", "urn:tag:character:qloo:mischievous"],
    mock: ["comedy", "family-comedy"],
  },
};

/** "an energetic and funny child" */
export function describeChild(ts: readonly Temperament[]): string {
  const words = ts.map((t) => TEMPERAMENT[t].adj).join(" and ");
  return `${/^[aeiou]/.test(words) ? "an" : "a"} ${words} child`;
}

/** Every Qloo tag for the chosen temperaments, without repeats. */
export const temperamentTags = (ts: readonly Temperament[]) => [...new Set(ts.flatMap((t) => TEMPERAMENT[t].tags))];

/** Mock mode: real Qloo tag IDs → the synthetic catalogue's tags. */
export const MOCK_TEMPERAMENT_TAGS: Record<string, string[]> = Object.fromEntries(
  Object.values(TEMPERAMENT).flatMap((t) => t.tags.map((tag) => [tag, t.mock])),
);
