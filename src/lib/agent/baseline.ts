// "Without Qloo" comparison board (FR-601): what you get from the same intake with no taste graph.

import { getConfig } from "../config";
import { baselineTilesLLM } from "../llm";
import type { Profile } from "../board/types";

export interface BaselineTile {
  category: "food" | "places" | "favourites";
  label: string;
  labelPrimary?: string;
}

// Mock-mode stand-in for a generic LLM answer: plausible, stereotyped, nothing near the person's home.
const GENERIC: Record<"in" | "latam" | "other", BaselineTile[]> = {
  in: [
    ...["Samosa", "Biryani", "Roti", "Dal", "Ice cream", "Chocolate", "Mango", "Milk"].map((label) => ({ category: "food" as const, label })),
    ...["Park", "School", "Temple", "Mall", "India Gate", "Market"].map((label) => ({ category: "places" as const, label })),
    ...["Cartoons", "Cricket", "Bollywood songs", "Video games", "Drawing", "Toys", "Ball", "Books", "TV", "Music"].map((label) => ({ category: "favourites" as const, label })),
  ],
  latam: [
    ...["Tacos", "Pizza", "Rice", "Beans", "Ice cream", "Candy", "Juice", "Milk"].map((label) => ({ category: "food" as const, label })),
    ...["Park", "School", "Beach", "Mall", "Church", "Store"].map((label) => ({ category: "places" as const, label })),
    ...["Cartoons", "Soccer", "Music", "Video games", "Dancing", "Toys", "Ball", "Books", "TV", "Movies"].map((label) => ({ category: "favourites" as const, label })),
  ],
  other: [
    ...["Pizza", "Sandwich", "Apple", "Ice cream", "Cookies", "Juice", "Milk", "Pasta"].map((label) => ({ category: "food" as const, label })),
    ...["Park", "School", "Store", "Library", "Playground", "Home"].map((label) => ({ category: "places" as const, label })),
    ...["Cartoons", "Music", "Video games", "Books", "Toys", "Ball", "TV", "Movies", "Drawing", "Sports"].map((label) => ({ category: "favourites" as const, label })),
  ],
};

export async function baselineTiles(profile: Profile): Promise<{ tiles: BaselineTile[]; source: "llm" | "mock" }> {
  if (getConfig().llmMode === "live") {
    try {
      const tiles = await baselineTilesLLM(profile);
      return { tiles: tiles.map((t) => ({ category: t.category, label: t.label_en, labelPrimary: t.label_primary })), source: "llm" };
    } catch {
      // fall through to the mock list
    }
  }
  const region = profile.primaryLang === "hi" ? "in" : profile.primaryLang === "es" ? "latam" : "other";
  return { tiles: GENERIC[region], source: "mock" };
}
