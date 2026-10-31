"use client";
// Web Speech API text-to-speech (FR-302). With no voice for the language it says the English text instead.
// Voices differ by device, so each language picks the gentlest one it can find: a natural / neural female
// voice when there is one (Edge's "Ana" child voice for English), never a known male voice if avoidable.

import { LANGUAGES, type Lang } from "../i18n";

const BCP47 = Object.fromEntries(Object.entries(LANGUAGES).map(([k, v]) => [k, [...v.speech]])) as Record<Lang, string[]>;

const NATURAL = /natural|neural|online|google|premium|enhanced/i;
const FEMALE: Record<Lang, RegExp> = {
  en: /\b(ana|aria|jenny|neerja|sonia|libby|emma|samantha|karen|moira|tessa|serena|zira|hazel|susan|fiona|veena|kate|female)\b|google us english/i,
  hi: /swara|kalpana|lekha|google हिन्दी/i,
  es: /dalia|elvira|paloma|paulina|m[oó]nica|helena|laura|sabina|google espa[nñ]ol/i,
};
const MALE = /\b(ravi|hemant|madhur|prabhat|david|mark|guy|ryan|rishi|jorge|pablo|diego|[aá]lvaro|ra[uú]l|daniel|george|james|thomas|alex|fred|arthur|aaron|male)\b/i;

function score(v: SpeechSynthesisVoice, lang: Lang): number {
  const tags = BCP47[lang];
  const at = tags.findIndex((t) => t.toLowerCase() === v.lang.toLowerCase());
  let s = at >= 0 ? 4 + (tags.length - at) * 0.5 : 2;
  if (FEMALE[lang].test(v.name)) s += 6;
  if (lang === "en" && /\bana\b/i.test(v.name)) s += 3; // Edge's young, soft voice
  if (NATURAL.test(v.name)) s += 3;
  if (MALE.test(v.name)) s -= 8;
  return s;
}

const chosen = new Map<Lang, SpeechSynthesisVoice | undefined>();
let listening = false;

function voiceFor(lang: Lang): SpeechSynthesisVoice | undefined {
  const synth = window.speechSynthesis;
  if (!synth) return undefined;
  if (!listening) {
    listening = true;
    // Chrome and Edge load voices late; re-pick once they arrive.
    synth.addEventListener?.("voiceschanged", () => chosen.clear());
  }
  if (chosen.has(lang)) return chosen.get(lang);
  const prefix = BCP47[lang][0].slice(0, 2).toLowerCase();
  const voices = synth.getVoices().filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix));
  const best = voices.sort((a, b) => score(b, lang) - score(a, lang))[0];
  if (voices.length) chosen.set(lang, best);
  return best;
}

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu;

/** The text with emoji removed, so a voice never reads "face with tears of joy". */
export const speakable = (text: string) => text.replace(EMOJI, "").replace(/\s+/g, " ").trim();

/** `english` is said instead when the device has no voice for `lang` (an English voice can't read Devanagari). */
export function speak(text: string, lang: Lang, english?: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const own = voiceFor(lang);
  const words = speakable(!own && lang !== "en" && english ? english : text);
  if (!words) return;
  const u = new SpeechSynthesisUtterance(words);
  const v = own ?? (lang !== "en" ? voiceFor("en") : undefined);
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  } else {
    u.lang = BCP47[lang][0];
  }
  // A little higher and slower than the default: calmer and easier to follow.
  u.pitch = 1.1;
  u.rate = 0.92;
  synth.speak(u);
}

export function hasVoice(lang: Lang): boolean {
  return typeof window !== "undefined" && !!voiceFor(lang);
}
