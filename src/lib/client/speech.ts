"use client";
// Web Speech API text-to-speech (FR-302). Falls back to English if no voice exists for the language.

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

export function speak(text: string, lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = voiceFor(lang) ?? (lang !== "en" ? voiceFor("en") : undefined);
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
