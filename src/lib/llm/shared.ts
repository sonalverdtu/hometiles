// Prompts and output schemas shared by every LLM provider.

import { z } from "zod";
import { LANGUAGES, type Lang } from "../i18n";

export const LANG_NAME = Object.fromEntries(Object.entries(LANGUAGES).map(([k, v]) => [k, v.llm])) as Record<Lang, string>;

export const TileTextSchema = z.object({
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

export const BaselineSchema = z.object({
  tiles: z.array(
    z.object({
      category: z.enum(["food", "places", "favourites"]),
      label_en: z.string(),
      label_primary: z.string(),
    }),
  ),
});

export interface TileTextInput {
  id: string;
  category: string;
  name: string;
  type: string;
}

export const TILE_TEXT_SYSTEM =
  "You write the words on AAC (communication board) tiles for a non-speaking person. " +
  "Labels are 1-3 words a person would recognise at a glance. Spoken phrases are short, natural, first-person sentences " +
  "the person would want to say, matched to the tile's category (food: asking for it; places: wanting to go; favourites: " +
  "sharing excitement; together: inviting a family member; new: starting a conversation). Keep proper names recognisable; " +
  "transliterate them into the target script when that language uses another script. Never add facts that aren't in the input.";
