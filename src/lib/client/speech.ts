"use client";
// Web Speech API text-to-speech (FR-302). With no voice for the language it says the English text instead.

import { LANGUAGES, type Lang } from "../i18n";

const BCP47 = Object.fromEntries(Object.entries(LANGUAGES).map(([k, v]) => [k, [...v.speech]])) as Record<Lang, string[]>;

function voiceFor(lang: Lang): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  for (const tag of BCP47[lang]) {
    const v = voices.find((x) => x.lang.toLowerCase() === tag.toLowerCase()) ?? voices.find((x) => x.lang.toLowerCase().startsWith(tag.slice(0, 2)));
    if (v) return v;
  }
  return undefined;
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
  u.rate = 0.95;
  synth.speak(u);
}

export function hasVoice(lang: Lang): boolean {
  return typeof window !== "undefined" && !!voiceFor(lang);
}
