// Everyday vocabulary: the general words every board needs (water, school, red, happy, drink…), in the spirit of
// Cboard's starter boards. They sit after the child's own Qloo tiles in each folder, so the board stays personal
// first but a child can still ask for things nobody predicted. Pictogram ids come from everyday-pictos.ts.

import type { Category, Lang, Localized } from "./types";

export interface EverydayWord {
  key: string;
  cat: Category;
  label: Localized;
  emoji: string;
  /** English keyword used to find the ARASAAC pictogram (scripts/everyday-pictos.mts). */
  arasaac: string;
  /** Only on boards whose home language is one of these (local staples). */
  only?: Lang[];
}

const w = (cat: Category, key: string, emoji: string, en: string, hi: string, es: string, arasaac = en, only?: Lang[]): EverydayWord => ({
  key,
  cat,
  emoji,
  label: { en, hi, es },
  arasaac,
  only,
});

export const EVERYDAY: EverydayWord[] = [
  // Food & drink basics, then a few home staples per language.
  w("food", "water", "💧", "water", "पानी", "agua"),
  w("food", "milk", "🥛", "milk", "दूध", "leche"),
  w("food", "juice", "🧃", "juice", "जूस", "jugo"),
  w("food", "fruit", "🍎", "fruit", "फल", "fruta"),
  w("food", "biscuit", "🍪", "biscuit", "बिस्किट", "galleta", "cookie"),
  w("food", "icecream", "🍦", "ice cream", "आइसक्रीम", "helado"),
  w("food", "bread", "🍞", "bread", "ब्रेड", "pan"),
  w("food", "rice", "🍚", "rice", "चावल", "arroz"),
  w("food", "egg", "🥚", "egg", "अंडा", "huevo"),
  w("food", "roti", "🫓", "roti", "रोटी", "roti", "chapati", ["hi"]),
  w("food", "dal", "🍲", "dal", "दाल", "dal", "lentils", ["hi"]),
  w("food", "tortilla", "🫓", "tortilla", "टॉर्टिला", "tortilla", "tortilla", ["es"]),
  w("food", "beans", "🫘", "beans", "राजमा", "frijoles", "beans", ["es"]),
  w("food", "sandwich", "🥪", "sandwich", "सैंडविच", "sándwich", "sandwich", ["en"]),
  w("food", "pasta", "🍝", "pasta", "पास्ता", "pasta", "pasta", ["en"]),

  // Everyday places.
  w("places", "home", "🏠", "home", "घर", "casa", "house"),
  w("places", "school", "🏫", "school", "स्कूल", "escuela"),
  w("places", "park", "🌳", "park", "पार्क", "parque"),
  w("places", "shop", "🛒", "shop", "दुकान", "tienda"),
  w("places", "doctor", "🩺", "doctor", "डॉक्टर", "doctor"),
  w("places", "outside", "🌤️", "outside", "बाहर", "afuera", "street"),
  w("places", "car", "🚗", "car", "गाड़ी", "carro"),
  w("places", "bus", "🚌", "bus", "बस", "autobús"),

  // People beyond the family.
  w("people", "teacher", "🧑‍🏫", "teacher", "टीचर", "maestra"),
  w("people", "friend", "🧒", "friend", "दोस्त", "amigo"),

  // Toys & things (Qloo's toy picks go in front of these).
  w("things", "ball", "⚽", "ball", "गेंद", "pelota"),
  w("things", "blocks", "🧱", "blocks", "ब्लॉक्स", "bloques", "blocks"),
  w("things", "doll", "🪆", "doll", "गुड़िया", "muñeca"),
  w("things", "teddy", "🧸", "teddy", "टेडी", "peluche", "teddy bear"),
  w("things", "toycar", "🚙", "toy car", "खिलौना गाड़ी", "carrito", "toy car"),
  w("things", "puzzle", "🧩", "puzzle", "पज़ल", "rompecabezas"),
  w("things", "book", "📖", "book", "किताब", "libro"),
  w("things", "crayons", "🖍️", "crayons", "क्रेयॉन", "crayones"),
  w("things", "bubbles", "🫧", "bubbles", "बुलबुले", "burbujas", "blow bubbles"),
  w("things", "tablet", "📱", "tablet", "टैबलेट", "tableta"),
  w("things", "tv", "📺", "TV", "टीवी", "tele", "television"),
  w("things", "swing", "🛝", "swing", "झूला", "columpio"),
  w("things", "bike", "🚲", "bike", "साइकिल", "bici", "bicycle"),

  // Action words (eat, play, go and like are core words already).
  w("actions", "drink", "🥤", "drink", "पीना", "beber"),
  w("actions", "sleep", "😴", "sleep", "सोना", "dormir"),
  w("actions", "wash", "🧼", "wash hands", "हाथ धोना", "lavarme las manos", "wash the hands"),
  w("actions", "bath", "🛁", "bath", "नहाना", "bañarme", "have a bath"),
  w("actions", "brush", "🪥", "brush teeth", "ब्रश करना", "cepillarme", "brush teeth"),
  w("actions", "watch", "👀", "watch", "देखना", "ver", "watch television"),
  w("actions", "listen", "👂", "listen", "सुनना", "escuchar"),
  w("actions", "read", "📖", "read", "पढ़ना", "leer"),
  w("actions", "draw", "🖍️", "draw", "ड्रॉ करना", "dibujar"),
  w("actions", "sing", "🎤", "sing", "गाना", "cantar"),
  w("actions", "dance", "💃", "dance", "नाचना", "bailar"),
  w("actions", "run", "🏃", "run", "दौड़ना", "correr"),
  w("actions", "jump", "🦘", "jump", "कूदना", "saltar"),
  w("actions", "sit", "🪑", "sit", "बैठना", "sentarme", "sit down"),
  w("actions", "look", "👁️", "look", "देखो", "mira"),
  w("actions", "come", "🫴", "come", "आओ", "ven"),
  w("actions", "give", "🤲", "give", "दो", "dame"),
  w("actions", "open", "📦", "open", "खोलो", "abre"),
  w("actions", "hug", "🤗", "hug", "गले लगाओ", "abrazo"),
  w("actions", "wait", "⏳", "wait", "इंतज़ार", "espera"),

  // Feelings (tired, scared, hurt and unwell are safety words already).
  w("feelings", "happy", "😊", "happy", "खुश", "feliz"),
  w("feelings", "sad", "😢", "sad", "उदास", "triste"),
  w("feelings", "angry", "😠", "angry", "गुस्सा", "enojado"),
  w("feelings", "excited", "🤩", "excited", "उत्साहित", "emocionado"),
  w("feelings", "bored", "😑", "bored", "बोर", "aburrido"),
  w("feelings", "calm", "😌", "calm", "शांत", "tranquilo"),
  w("feelings", "love", "🥰", "love", "प्यार", "amor"),
  w("feelings", "shy", "🙈", "shy", "शर्म", "tímido"),

  // Colours and describing words.
  w("describe", "red", "🔴", "red", "लाल", "rojo"),
  w("describe", "blue", "🔵", "blue", "नीला", "azul"),
  w("describe", "green", "🟢", "green", "हरा", "verde"),
  w("describe", "yellow", "🟡", "yellow", "पीला", "amarillo"),
  w("describe", "orange", "🟠", "orange", "नारंगी", "naranja", "orange colour"),
  w("describe", "purple", "🟣", "purple", "बैंगनी", "morado"),
  w("describe", "pink", "🩷", "pink", "गुलाबी", "rosa"),
  w("describe", "black", "⚫", "black", "काला", "negro"),
  w("describe", "white", "⚪", "white", "सफ़ेद", "blanco"),
  w("describe", "brown", "🟤", "brown", "भूरा", "café"),
  w("describe", "big", "🐘", "big", "बड़ा", "grande"),
  w("describe", "little", "🐭", "little", "छोटा", "pequeño", "small"),
  w("describe", "hot", "🔥", "hot", "गरम", "caliente"),
  w("describe", "cold", "🧊", "cold", "ठंडा", "frío"),
  w("describe", "fast", "⚡", "fast", "तेज़", "rápido"),
  w("describe", "slow", "🐢", "slow", "धीरे", "lento"),
  w("describe", "loud", "📢", "loud", "ज़ोर से", "fuerte", "noise"),
  w("describe", "quiet", "🤫", "quiet", "चुप", "callado", "silence"),

  // Body (pairs with "it hurts").
  w("body", "head", "🙆", "head", "सिर", "cabeza"),
  w("body", "tummy", "🫃", "tummy", "पेट", "panza", "belly"),
  w("body", "ear", "👂", "ear", "कान", "oreja"),
  w("body", "eye", "👁️", "eye", "आँख", "ojo"),
  w("body", "mouth", "👄", "mouth", "मुँह", "boca"),
  w("body", "teeth", "🦷", "teeth", "दाँत", "dientes"),
  w("body", "hand", "✋", "hand", "हाथ", "mano", "hands"),
  w("body", "leg", "🦵", "leg", "पैर", "pierna"),

  // Chat & questions.
  w("chat", "hello", "👋", "hello", "नमस्ते", "hola"),
  w("chat", "bye", "🙋", "bye", "बाय", "adiós", "goodbye"),
  w("chat", "thanks", "🙌", "thank you", "थैंक यू", "gracias"),
  w("chat", "sorry", "😔", "sorry", "सॉरी", "perdón"),
  w("chat", "myturn", "☝️", "my turn", "मेरी बारी", "mi turno", "my turn"),
  w("chat", "yourturn", "👉", "your turn", "तुम्हारी बारी", "tu turno", "your turn"),
  w("chat", "what", "❓", "what?", "क्या?", "¿qué?", "what"),
  w("chat", "where", "🗺️", "where?", "कहाँ?", "¿dónde?", "where"),
  w("chat", "who", "🧑", "who?", "कौन?", "¿quién?", "who"),
  w("chat", "again", "🔁", "again", "फिर से", "otra vez"),
  w("chat", "dontknow", "🤷", "I don't know", "पता नहीं", "no sé", "I don't know"),
];

export function everydayFor(lang: Lang): EverydayWord[] {
  return EVERYDAY.filter((x) => !x.only || x.only.includes(lang));
}
