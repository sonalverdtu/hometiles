// Routes LLM work to whichever provider has a key: Claude (preferred) or Gemini.

import { getConfig } from "../config";
import type { Profile } from "../board/types";
import { baselinePrompt, llmOnlyBaseline, writeTileText as claudeTileText } from "./claude";
import { baselineGemini, writeTileTextGemini } from "./gemini";
import { TILE_TEXT_SYSTEM, type TileTextInput } from "./shared";

export function writeTileText(profile: Profile, items: TileTextInput[]) {
  return getConfig().llmProvider === "gemini" ? writeTileTextGemini(profile, items, TILE_TEXT_SYSTEM) : claudeTileText(profile, items);
}

export function baselineTilesLLM(profile: Profile) {
  return getConfig().llmProvider === "gemini" ? baselineGemini(profile, baselinePrompt(profile)) : llmOnlyBaseline(profile);
}
