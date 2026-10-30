// Claude calls (server only). Uses the official SDK; refusal fallbacks enabled by default.

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { getConfig } from "../config";
import type { Profile } from "../board/types";
import { BaselineSchema, LANG_NAME, TILE_TEXT_SYSTEM, TileTextSchema, type TileTextInput } from "./shared";
import type { z } from "zod";

export const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let client: Anthropic | null = null;
export function claude(): Anthropic {
  client ??= new Anthropic({ timeout: 60_000, maxRetries: 1 });
  return client;
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
    system: TILE_TEXT_SYSTEM,
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

/** Any small structured task: the reply is parsed against the zod schema. */
export async function claudeJson<T>(schema: z.ZodType<T>, system: string, prompt: string): Promise<T> {
  const response = await claude().beta.messages.parse({
    model: getConfig().llmModel,
    max_tokens: 4000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error("Claude returned no structured answer");
  return response.parsed_output as T;
}

/** "Without Qloo" board: what an LLM produces from the same intake with no external data (FR-601). */
export async function llmOnlyBaseline(profile: Profile, prompt = baselinePrompt(profile)) {
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
        content: prompt,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined the baseline request");
  return response.parsed_output?.tiles ?? [];
}

export function baselinePrompt(profile: Profile) {
  return (
    `Suggest personalised AAC board tiles for a ${profile.isChild ? "child" : "person"} living in ${profile.city}, ` +
    `whose family speaks ${LANG_NAME[profile.primaryLang]}. They love: ${profile.loves.map((l) => l.name).join(", ")}. ` +
    `Give 8 food tiles, 6 places tiles and 10 favourites tiles. label_primary is in ${LANG_NAME[profile.primaryLang]}.`
  );
}
