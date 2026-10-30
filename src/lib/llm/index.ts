// Routes LLM work to whichever provider has a key: Claude (preferred) or Gemini.

import { getConfig } from "../config";
import type { Profile } from "../board/types";
import { baselinePrompt, llmOnlyBaseline, writeTileText as claudeTileText } from "./claude";
import { z } from "zod";
import { claudeJson } from "./claude";
import { baselineGemini, json as geminiJson, writeTileTextGemini } from "./gemini";
import { TILE_TEXT_SYSTEM, type TileTextInput } from "./shared";

export function writeTileText(profile: Profile, items: TileTextInput[]) {
  return getConfig().llmProvider === "gemini" ? writeTileTextGemini(profile, items, TILE_TEXT_SYSTEM) : claudeTileText(profile, items);
}

const SnackSchema = z.object({ names: z.array(z.string().min(1).max(60)).max(10) });

/**
 * Snack and drink brands children commonly have where this family lives. Qloo's own brand results lean
 * global (Skittles and Hershey for a child in Delhi), while an LLM knows local staples but also invents and
 * misremembers. So this only proposes names: each one must then be found in Qloo before it becomes a tile.
 */
export async function proposeLocalSnacks(profile: Profile): Promise<string[]> {
  const system = "You list real, widely sold snack and drink brands. Brand names only, no descriptions. Nothing with caffeine or alcohol.";
  const prompt =
    `List 8 snack, sweet or drink brands that ${profile.isChild ? "children" : "people"} commonly have at home or buy locally in ${profile.city}. ` +
    "Prefer local and regional brands over global ones. Give each brand's usual name as printed on the pack.";
  const out = getConfig().llmProvider === "gemini" ? await geminiJson(SnackSchema, system, prompt) : await claudeJson(SnackSchema, system, prompt);
  return out.names;
}

export function baselineTilesLLM(profile: Profile) {
  return getConfig().llmProvider === "gemini" ? baselineGemini(profile, baselinePrompt(profile)) : llmOnlyBaseline(profile);
}
