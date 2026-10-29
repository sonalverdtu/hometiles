// Claude calls (server only). Uses the official SDK; refusal fallbacks enabled by default.

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getConfig } from "../config";
import type { Lang, Profile } from "../board/types";

export const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let client: Anthropic | null = null;
export function claude(): Anthropic {
  client ??= new Anthropic({ timeout: 60_000, maxRetries: 1 });
  return client;
}

const LANG_NAME: Record<Lang, string> = { en: "English", hi: "Hindi (Devanagari script)", es: "Spanish" };

const TileTextSchema = z.object({
  tiles: z.array(
    z.object({
      id: z.string(),
      label_primary: z.string(),
      label_secondary: z.string(),
      speak_primary: z.string(),
      speak_secondary: z.string(),
    }),
  ),
});

export interface TileTextInput {
  id: string;
  category: string;
  name: string;
  type: string;
}

/** Short bilingual labels + natural spoken phrases for each tile (FR-206). */
export async function writeTileText(profile: Profile, items: TileTextInput[]) {
  const { llmModel } = getConfig();
  const primary = profile.primaryLang;
  const secondary = profile.secondaryLang ?? "en";
  const response = await claude().beta.messages.parse({
    model: llmModel,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(TileTextSchema) },
    system:
      "You write the words on AAC (communication board) tiles for a non-speaking person. " +
      "Labels are 1-3 words a person would recognise at a glance. Spoken phrases are short, natural, first-person sentences " +
      "the person would want to say, matched to the tile's category (food: asking for it; places: wanting to go; favourites: " +
      "sharing excitement; together: inviting a family member; new: starting a conversation). Keep proper names recognisable; " +
      "transliterate them into the target script when that language uses another script. Never add facts that aren't in the input.",
    messages: [
      {
        role: "user",
        content:
          `Primary language: ${LANG_NAME[primary]}. Secondary language: ${LANG_NAME[secondary]}. ` +
          `The person is ${profile.isChild ? "a child" : "an adult"}.\n` +
          `Return one entry per tile id.\nTiles:\n${JSON.stringify(items)}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined the labelling request");
  return { parsed: response.parsed_output, primary, secondary };
}

const BaselineSchema = z.object({
  tiles: z.array(
    z.object({
      category: z.enum(["food", "places", "favourites"]),
      label_en: z.string(),
      label_primary: z.string(),
    }),
  ),
});

/** "Without Qloo" board: what an LLM produces from the same intake with no external data (FR-601). */
export async function llmOnlyBaseline(profile: Profile) {
  const { llmModel } = getConfig();
  const response = await claude().beta.messages.parse({
    model: llmModel,
    max_tokens: 8000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(BaselineSchema) },
    messages: [
      {
        role: "user",
        content:
          `Suggest personalised AAC board tiles for a ${profile.isChild ? "child" : "person"} living in ${profile.city}, ` +
          `whose family speaks ${LANG_NAME[profile.primaryLang]}. They love: ${profile.loves.map((l) => l.name).join(", ")}. ` +
          `Give 8 food tiles, 6 places tiles and 10 favourites tiles. label_primary is in ${LANG_NAME[profile.primaryLang]}.`,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined the baseline request");
  return response.parsed_output?.tiles ?? [];
}
