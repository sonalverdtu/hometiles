// Fixed vocabulary: core words, safety words, folder titles and phrase templates (en / hi / es).

import type { Category, Lang, Localized } from "./types";

export interface VocabWord {
  key: string;
  label: Localized;
  speak?: Localized;
  emoji: string;
  arasaac: string;
}

export const CORE: VocabWord[] = [
  { key: "i", label: { en: "I", hi: "मैं", es: "Yo" }, emoji: "🙋", arasaac: "I" },
  { key: "want", label: { en: "want", hi: "चाहिए", es: "quiero" }, emoji: "🤲", arasaac: "want" },
  { key: "more", label: { en: "more", hi: "और", es: "más" }, emoji: "➕", arasaac: "more" },
  { key: "stop", label: { en: "stop", hi: "रुको", es: "para" }, emoji: "✋", arasaac: "stop" },
  { key: "yes", label: { en: "yes", hi: "हाँ", es: "sí" }, emoji: "✅", arasaac: "yes" },
  { key: "no", label: { en: "no", hi: "नहीं", es: "no" }, emoji: "❌", arasaac: "no" },
  { key: "like", label: { en: "like", hi: "पसंद", es: "me gusta" }, emoji: "❤️", arasaac: "like" },
  { key: "go", label: { en: "go", hi: "चलो", es: "vamos" }, emoji: "🚶", arasaac: "go" },
  { key: "eat", label: { en: "eat", hi: "खाना", es: "comer" }, emoji: "🍽️", arasaac: "eat" },
  { key: "play", label: { en: "play", hi: "खेलना", es: "jugar" }, emoji: "🎲", arasaac: "play" },
  { key: "finished", label: { en: "finished", hi: "ख़त्म", es: "terminé" }, emoji: "🏁", arasaac: "finish" },
  { key: "please", label: { en: "please", hi: "प्लीज़", es: "por favor" }, emoji: "🙏", arasaac: "please" },
];

export const SAFETY: VocabWord[] = [
  { key: "help", label: { en: "help", hi: "मदद", es: "ayuda" }, speak: { en: "I need help", hi: "मुझे मदद चाहिए", es: "Necesito ayuda" }, emoji: "🆘", arasaac: "help" },
  { key: "pain", label: { en: "it hurts", hi: "दर्द", es: "me duele" }, speak: { en: "It hurts", hi: "मुझे दर्द हो रहा है", es: "Me duele" }, emoji: "🤕", arasaac: "pain" },
  { key: "toilet", label: { en: "toilet", hi: "टॉयलेट", es: "baño" }, speak: { en: "I need the toilet", hi: "मुझे टॉयलेट जाना है", es: "Necesito ir al baño" }, emoji: "🚽", arasaac: "toilet" },
  { key: "tired", label: { en: "tired", hi: "थक गया", es: "cansado" }, speak: { en: "I am tired", hi: "मैं थक गया हूँ", es: "Estoy cansado" }, emoji: "😴", arasaac: "tired" },
  { key: "scared", label: { en: "scared", hi: "डर", es: "miedo" }, speak: { en: "I am scared", hi: "मुझे डर लग रहा है", es: "Tengo miedo" }, emoji: "😨", arasaac: "fear" },
  { key: "unwell", label: { en: "not well", hi: "तबीयत ठीक नहीं", es: "me siento mal" }, speak: { en: "I don't feel well", hi: "मेरी तबीयत ठीक नहीं है", es: "Me siento mal" }, emoji: "🤒", arasaac: "sick" },
];

export const FOLDER_META: Record<Category, { title: Localized; emoji: string }> = {
  core: { title: { en: "Core", hi: "मुख्य", es: "Básico" }, emoji: "⭐" },
  safety: { title: { en: "I need", hi: "ज़रूरी", es: "Necesito" }, emoji: "🆘" },
  people: { title: { en: "My people", hi: "मेरे लोग", es: "Mi gente" }, emoji: "👪" },
  food: { title: { en: "Food & snacks", hi: "खाना", es: "Comida" }, emoji: "🍲" },
  places: { title: { en: "My places", hi: "मेरी जगहें", es: "Mis lugares" }, emoji: "📍" },
  favourites: { title: { en: "Favourites", hi: "पसंदीदा", es: "Favoritos" }, emoji: "🌟" },
  fun: { title: { en: "Fun & banter", hi: "मस्ती", es: "Bromas" }, emoji: "😂" },
  together: { title: { en: "Talk together", hi: "साथ में", es: "Juntos" }, emoji: "🤝" },
  new: { title: { en: "What's new", hi: "नया क्या है", es: "Lo nuevo" }, emoji: "✨" },
};

type Tpl = Record<Lang, (name: string) => string>;

export const PHRASES: Record<"food" | "places" | "favourites" | "together" | "new" | "people", Tpl> = {
  food: { en: (n) => `I want ${n}`, hi: (n) => `मुझे ${n} चाहिए`, es: (n) => `Quiero ${n}` },
  places: { en: (n) => `I want to go to ${n}`, hi: (n) => `मुझे ${n} जाना है`, es: (n) => `Quiero ir a ${n}` },
  favourites: { en: (n) => `${n} is my favourite!`, hi: (n) => `${n} मेरा पसंदीदा है!`, es: (n) => `¡${n} es mi favorito!` },
  together: { en: (n) => `Let's do ${n} together!`, hi: (n) => `चलो साथ में ${n}!`, es: (n) => `¡Hagamos ${n} juntos!` },
  new: { en: (n) => `Have you seen ${n}?`, hi: (n) => `क्या तुमने ${n} देखा?`, es: (n) => `¿Ya viste ${n}?` },
  people: { en: (n) => `${n}, come here!`, hi: (n) => `${n}, यहाँ आओ!`, es: (n) => `¡${n}, ven aquí!` },
};

const TOGETHER_VERB: Record<"watch" | "listen" | "play" | "eat", Tpl> = {
  watch: { en: (n) => `Let's watch ${n} together!`, hi: (n) => `चलो साथ में ${n} देखते हैं!`, es: (n) => `¡Veamos ${n} juntos!` },
  listen: { en: (n) => `Let's listen to ${n} together!`, hi: (n) => `चलो साथ में ${n} सुनते हैं!`, es: (n) => `¡Escuchemos a ${n} juntos!` },
  play: { en: (n) => `Let's play ${n} together!`, hi: (n) => `चलो साथ में ${n} खेलते हैं!`, es: (n) => `¡Juguemos ${n} juntos!` },
  eat: { en: (n) => `Let's have ${n} together!`, hi: (n) => `चलो साथ में ${n} खाते हैं!`, es: (n) => `¡Comamos ${n} juntos!` },
};

export function togetherPhrase(type: string): Tpl {
  if (/artist|podcast/.test(type)) return TOGETHER_VERB.listen;
  if (/video_game/.test(type)) return TOGETHER_VERB.play;
  if (/brand|place/.test(type)) return TOGETHER_VERB.eat;
  return TOGETHER_VERB.watch;
}

export const BANTER: Tpl[] = [
  { en: (n) => `Bet ${n} would beat you!`, hi: (n) => `${n} तुम्हें हरा देगा!`, es: (n) => `¡${n} te ganaría!` },
  { en: (n) => `Guess what happened in ${n}!`, hi: (n) => `अंदाज़ा लगाओ ${n} में क्या हुआ!`, es: (n) => `¡Adivina qué pasó en ${n}!` },
  { en: (n) => `You're so ${n}! 😂`, hi: (n) => `तुम तो बिल्कुल ${n} हो! 😂`, es: (n) => `¡Eres tan ${n}! 😂` },
];

export const REACTIONS: { label: Localized; emoji: string }[] = [
  { label: { en: "No way!", hi: "क्या बात है!", es: "¡No puede ser!" }, emoji: "😲" },
  { label: { en: "That's so funny!", hi: "बहुत मज़ेदार!", es: "¡Qué chistoso!" }, emoji: "🤣" },
  { label: { en: "Gross!", hi: "छी!", es: "¡Qué asco!" }, emoji: "🤢" },
  { label: { en: "I'm the best!", hi: "मैं सबसे अच्छा हूँ!", es: "¡Soy el mejor!" }, emoji: "😎" },
];

export const TYPE_EMOJI: Record<string, string> = {
  "urn:entity:tv_show": "📺",
  "urn:entity:movie": "🎬",
  "urn:entity:video_game": "🎮",
  "urn:entity:artist": "🎵",
  "urn:entity:brand": "🍪",
  "urn:entity:place": "📍",
  "urn:entity:book": "📚",
  "urn:entity:podcast": "🎧",
  "urn:entity:person": "🧑",
  "urn:entity:destination": "🗺️",
};

export function pick(l: Localized, lang: Lang): string {
  return l[lang] ?? l.en;
}
