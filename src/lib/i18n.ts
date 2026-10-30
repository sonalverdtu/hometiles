// Every supported language lives here, once. English is the default (HomeTiles is built for any family,
// anywhere); Hindi and Spanish are supported languages. Adding a language = one entry in LANGUAGES and UI,
// plus its words in board/vocab.ts and board/sentence.ts.

export const LANGUAGES = {
  en: { native: "English", english: "English", llm: "English", speech: ["en-GB", "en-US", "en-IN", "en-AU"] },
  hi: { native: "हिंदी", english: "Hindi", llm: "Hindi (Devanagari script)", speech: ["hi-IN"] },
  es: { native: "Español", english: "Spanish", llm: "Spanish", speech: ["es-MX", "es-US", "es-ES"] },
} as const;

export type Lang = keyof typeof LANGUAGES;
export const LANG_CODES = Object.keys(LANGUAGES) as Lang[];
export const DEFAULT_LANG: Lang = "en";

/** "Español (Spanish)" for the picker, or just "English". */
export function langLabel(l: Lang): string {
  const x = LANGUAGES[l];
  return x.native === x.english ? x.native : `${x.native} (${x.english})`;
}

/** The few words the child-mode screen itself shows. */
export const UI: Record<Lang, Record<"tapHint" | "speak" | "forMe" | "allWords" | "maybeNext" | "saidBefore" | "back", string>> = {
  en: { tapHint: "Tap the pictures…", speak: "Speak", forMe: "For me", allWords: "All words", maybeNext: "Maybe next", saidBefore: "Said before", back: "Back" },
  hi: { tapHint: "टाइल दबाओ…", speak: "बोलो", forMe: "मेरे लिए", allWords: "सारे शब्द", maybeNext: "शायद अब यह कहना है", saidBefore: "पहले कहा", back: "वापस" },
  es: { tapHint: "Toca las fichas…", speak: "Hablar", forMe: "Para mí", allWords: "Todas", maybeNext: "Quizás quieres decir", saidBefore: "Dije antes", back: "Atrás" },
};
