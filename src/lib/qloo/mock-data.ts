// SYNTHETIC demo catalogue for mock mode. Not Qloo data.
// Names of shows/artists/brands are public; every score, tag, place and coordinate here is invented.

import type { QlooType } from "./types";

export type Audience = "kids" | "teens" | "adults" | "elders" | "all";
export type Culture = "in" | "latam" | "uk" | "global";

export interface MockItem {
  id: string;
  name: string;
  hi?: string;
  es?: string;
  type: QlooType;
  tags: string[];
  audience: Audience;
  culture: Culture;
  popularity: number;
  rising?: boolean;
  city?: CityId;
  lat?: number;
  lon?: number;
  address?: string;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function item(
  type: QlooType,
  name: string,
  tags: string[],
  audience: Audience,
  culture: Culture,
  popularity: number,
  extra: Partial<MockItem> = {},
): MockItem {
  const short = type.split(":")[2];
  return { id: `mock-${short}-${slug(name)}`, name, type, tags, audience, culture, popularity, ...extra };
}

const TV = "urn:entity:tv_show" as const;
const GAME = "urn:entity:videogame" as const;
const ARTIST = "urn:entity:artist" as const;
const MOVIE = "urn:entity:movie" as const;
const BRAND = "urn:entity:brand" as const;
const PLACE = "urn:entity:place" as const;

export const DELHI_CENTER = { lat: 28.6492, lon: 77.122 };
export const LA_CENTER = { lat: 34.0333, lon: -118.205 };
export const LONDON_CENTER = { lat: 51.539, lon: -0.1426 };

/** The mock's demo cities. A location query or point is matched to the nearest one. */
export const CITIES = {
  delhi: { center: DELHI_CENTER, culture: "in" as Culture, match: /delhi|rajouri|india|noida|gurgaon/ },
  la: { center: LA_CENTER, culture: "latam" as Culture, match: /los angeles|\bla\b|boyle|california/ },
  london: { center: LONDON_CENTER, culture: "uk" as Culture, match: /london|camden|england|\buk\b|britain/ },
};
export type CityId = keyof typeof CITIES;

const d = (dLat: number, dLon: number) => ({ lat: DELHI_CENTER.lat + dLat, lon: DELHI_CENTER.lon + dLon, city: "delhi" as const });
const l = (dLat: number, dLon: number) => ({ lat: LA_CENTER.lat + dLat, lon: LA_CENTER.lon + dLon, city: "la" as const });
const uk = (dLat: number, dLon: number) => ({ lat: LONDON_CENTER.lat + dLat, lon: LONDON_CENTER.lon + dLon, city: "london" as const });

export const CATALOGUE: MockItem[] = [
  // ---- India: TV / film ----
  item(TV, "Chhota Bheem", ["kids-animation", "indian-mythology", "adventure"], "kids", "in", 0.92, { hi: "छोटा भीम" }),
  item(TV, "Mighty Little Bheem", ["kids-animation", "indian-mythology", "toddler"], "kids", "in", 0.8, { hi: "माइटी लिटिल भीम", rising: true }),
  item(TV, "Motu Patlu", ["kids-animation", "comedy"], "kids", "in", 0.88, { hi: "मोटू पतलू" }),
  item(TV, "Little Singham", ["kids-animation", "superhero", "adventure"], "kids", "in", 0.84, { hi: "लिटिल सिंघम", rising: true }),
  item(TV, "Oggy and the Cockroaches", ["kids-animation", "comedy"], "kids", "global", 0.78, { hi: "ऑगी और कॉकरोच" }),
  item(TV, "Taarak Mehta Ka Ooltah Chashmah", ["family-comedy", "comedy"], "all", "in", 0.86, { hi: "तारक मेहता का उल्टा चश्मा" }),
  item(TV, "Ramayan", ["indian-mythology", "devotional", "classic-tv"], "elders", "in", 0.7, { hi: "रामायण" }),
  item(TV, "Pokémon", ["anime", "kids-animation", "adventure", "gaming-collect"], "kids", "global", 0.85, { hi: "पोकेमॉन", es: "Pokémon" }),
  item(MOVIE, "Bal Ganesh", ["kids-animation", "indian-mythology"], "kids", "in", 0.62, { hi: "बाल गणेश" }),
  item(MOVIE, "Hanuman", ["kids-animation", "indian-mythology", "superhero"], "kids", "in", 0.6, { hi: "हनुमान" }),
  item(MOVIE, "Lagaan", ["cricket", "bollywood", "classic-film"], "all", "in", 0.74, { hi: "लगान" }),
  item(MOVIE, "Sholay", ["bollywood-retro", "classic-film"], "elders", "in", 0.8, { hi: "शोले" }),
  item(MOVIE, "Taare Zameen Par", ["family-drama", "bollywood"], "all", "in", 0.76, { hi: "तारे ज़मीन पर" }),
  item(MOVIE, "Spider-Man: Into the Spider-Verse", ["superhero", "animation"], "kids", "global", 0.83, { hi: "स्पाइडर-मैन", es: "Spider-Man: Un nuevo universo" }),
  // ---- Games (global) ----
  item(GAME, "Minecraft", ["gaming-sandbox", "building", "adventure"], "kids", "global", 0.95, { hi: "माइनक्राफ्ट" }),
  item(GAME, "Roblox", ["gaming-sandbox", "social-gaming"], "kids", "global", 0.9, { hi: "रोब्लॉक्स", rising: true }),
  item(GAME, "Subway Surfers", ["gaming-runner", "mobile-game"], "kids", "global", 0.86, { hi: "सबवे सर्फर्स" }),
  item(GAME, "Temple Run", ["gaming-runner", "mobile-game", "adventure"], "kids", "global", 0.75, { hi: "टेंपल रन" }),
  item(GAME, "Ludo King", ["board-game", "family-game", "mobile-game"], "all", "in", 0.88, { hi: "लूडो किंग" }),
  item(GAME, "Mario Kart 8 Deluxe", ["gaming-racing", "family-game"], "kids", "global", 0.87, { es: "Mario Kart 8 Deluxe" }),
  item(GAME, "EA Sports FC", ["soccer", "sports-game"], "teens", "global", 0.84, { es: "EA Sports FC", rising: true }),
  // ---- India: music ----
  item(ARTIST, "Arijit Singh", ["bollywood", "romantic-songs"], "teens", "in", 0.93, { hi: "अरिजीत सिंह" }),
  item(ARTIST, "Shreya Ghoshal", ["bollywood", "romantic-songs"], "adults", "in", 0.85, { hi: "श्रेया घोषाल" }),
  item(ARTIST, "Mohammed Rafi", ["bollywood-retro", "classic-songs"], "elders", "in", 0.82, { hi: "मोहम्मद रफ़ी" }),
  item(ARTIST, "Kishore Kumar", ["bollywood-retro", "classic-songs", "comedy"], "elders", "in", 0.84, { hi: "किशोर कुमार" }),
  item(ARTIST, "Diljit Dosanjh", ["punjabi-pop", "bollywood", "dance"], "teens", "in", 0.88, { hi: "दिलजीत दोसांझ", rising: true }),
  item(ARTIST, "ChuChu TV", ["kids-songs", "kids-animation"], "kids", "in", 0.8, { hi: "चूचू टीवी" }),
  // ---- India: brands / snacks ----
  item(BRAND, "Parle-G", ["snacks", "biscuits", "chai"], "all", "in", 0.95, { hi: "पारले-जी" }),
  item(BRAND, "Haldiram's", ["snacks", "sweets", "namkeen"], "all", "in", 0.9, { hi: "हल्दीराम" }),
  item(BRAND, "Amul", ["dairy", "sweets", "ice-cream"], "all", "in", 0.92, { hi: "अमूल" }),
  item(BRAND, "Maggi", ["snacks", "noodles"], "kids", "in", 0.9, { hi: "मैगी" }),
  item(BRAND, "Frooti", ["drinks", "mango"], "kids", "in", 0.83, { hi: "फ्रूटी" }),
  item(BRAND, "Britannia Good Day", ["biscuits", "snacks"], "kids", "in", 0.78, { hi: "गुड डे बिस्किट" }),
  item(BRAND, "Cadbury Dairy Milk", ["sweets", "chocolate"], "kids", "in", 0.89, { hi: "डेरी मिल्क" }),
  item(BRAND, "Kurkure", ["snacks", "namkeen"], "teens", "in", 0.8, { hi: "कुरकुरे" }),
  // ---- Delhi: places (FICTIONAL) ----
  item(PLACE, "Sharma Ji Chaat Bhandar", ["street-food", "chaat", "golgappe"], "all", "in", 0.7, { hi: "शर्मा जी चाट भंडार", ...d(0.0021, 0.0013), address: "Main Market (demo)" }),
  item(PLACE, "Gupta Sweets Corner", ["sweets", "street-food"], "all", "in", 0.66, { hi: "गुप्ता स्वीट्स", ...d(-0.0015, 0.0024), address: "J Block (demo)" }),
  item(PLACE, "Rajouri Kids Park", ["parks", "family-outing", "play"], "kids", "in", 0.6, { hi: "राजौरी किड्स पार्क", ...d(0.0042, -0.0018), address: "Ring Road side (demo)" }),
  item(PLACE, "Funcity Play Zone", ["play", "family-outing", "gaming-arcade"], "kids", "in", 0.64, { hi: "फनसिटी प्ले ज़ोन", ...d(-0.0061, 0.0049), address: "Mall Road (demo)" }),
  item(PLACE, "Ram Ji Momos", ["street-food", "momos"], "teens", "in", 0.68, { hi: "राम जी मोमोज़", ...d(0.0012, -0.0035), address: "Metro Gate 2 (demo)" }),
  item(PLACE, "Pind Da Dhaba", ["north-indian", "family-dinner"], "all", "in", 0.71, { hi: "पिंड दा ढाबा", ...d(-0.0033, -0.0042), address: "Najafgarh Rd (demo)" }),
  item(PLACE, "Tagore Garden Chai Stall", ["chai", "street-food"], "elders", "in", 0.55, { hi: "टैगोर गार्डन चाय", ...d(0.0071, 0.0058), address: "Tagore Garden (demo)" }),
  item(PLACE, "Shiv Mandir", ["devotional", "temple"], "elders", "in", 0.58, { hi: "शिव मंदिर", ...d(-0.0024, 0.0067), address: "Block C (demo)" }),
  item(PLACE, "Kulfi Wala Corner", ["sweets", "ice-cream"], "kids", "in", 0.62, { hi: "कुल्फ़ी वाला", ...d(0.0029, 0.0041), address: "Main Market (demo)" }),
  item(PLACE, "Neighbourhood Science Club", ["science", "learning", "play"], "kids", "in", 0.45, { hi: "साइंस क्लब", ...d(0.0091, -0.0063), address: "Community Centre (demo)" }),
  // ---- Latin America / LA ----
  item(TV, "Bluey", ["kids-animation", "family-comedy"], "kids", "global", 0.93, { es: "Bluey" }),
  item(TV, "SpongeBob SquarePants", ["kids-animation", "comedy"], "kids", "global", 0.9, { es: "Bob Esponja" }),
  item(TV, "The Casagrandes", ["kids-animation", "latino-family", "comedy"], "kids", "latam", 0.74, { es: "Los Casagrandes" }),
  item(TV, "Elena of Avalor", ["kids-animation", "latino-family", "adventure"], "kids", "latam", 0.72, { es: "Elena de Ávalor" }),
  item(TV, "La Rosa de Guadalupe", ["telenovela", "family-drama"], "elders", "latam", 0.7, { es: "La Rosa de Guadalupe" }),
  item(MOVIE, "Coco", ["animation", "latino-family", "music-film"], "all", "latam", 0.94, { es: "Coco" }),
  item(MOVIE, "Encanto", ["animation", "latino-family", "music-film"], "kids", "latam", 0.92, { es: "Encanto", rising: true }),
  item(ARTIST, "Bad Bunny", ["reggaeton", "latin-pop"], "teens", "latam", 0.95, { es: "Bad Bunny" }),
  item(ARTIST, "Karol G", ["reggaeton", "latin-pop", "dance"], "teens", "latam", 0.9, { es: "Karol G", rising: true }),
  item(ARTIST, "Selena Quintanilla", ["latin-pop", "classic-songs", "tejano"], "adults", "latam", 0.82, { es: "Selena" }),
  item(ARTIST, "Vicente Fernández", ["ranchera", "classic-songs"], "elders", "latam", 0.8, { es: "Vicente Fernández" }),
  item(ARTIST, "Shakira", ["latin-pop", "dance"], "all", "latam", 0.9, { es: "Shakira" }),
  item(BRAND, "Takis", ["snacks", "spicy"], "teens", "latam", 0.86, { es: "Takis" }),
  item(BRAND, "Tajín", ["snacks", "fruit", "spicy"], "all", "latam", 0.84, { es: "Tajín" }),
  item(BRAND, "Jarritos", ["drinks", "fruit"], "all", "latam", 0.82, { es: "Jarritos" }),
  item(BRAND, "Gansito", ["sweets", "snacks"], "kids", "latam", 0.78, { es: "Gansito" }),
  item(BRAND, "Mazapán de la Rosa", ["sweets", "candy"], "all", "latam", 0.76, { es: "Mazapán de la Rosa" }),
  item(BRAND, "Abuelita", ["chocolate", "drinks", "sweets"], "elders", "latam", 0.74, { es: "Chocolate Abuelita" }),
  // ---- LA: places (FICTIONAL) ----
  item(PLACE, "Tacos El Güero", ["street-food", "tacos"], "all", "latam", 0.72, { es: "Tacos El Güero", ...l(0.0018, 0.0011), address: "1st St (demo)" }),
  item(PLACE, "Paletería La Esquina", ["sweets", "ice-cream", "fruit"], "kids", "latam", 0.7, { es: "Paletería La Esquina", ...l(-0.0014, 0.0022), address: "Cesar Chavez Ave (demo)" }),
  item(PLACE, "Panadería Rosita", ["sweets", "bakery"], "all", "latam", 0.66, { es: "Panadería Rosita", ...l(0.0032, -0.0019), address: "Soto St (demo)" }),
  item(PLACE, "Eastside Kids Park", ["parks", "play", "family-outing"], "kids", "latam", 0.6, { es: "Parque Infantil Eastside", ...l(-0.0047, -0.0031), address: "Park Ave (demo)" }),
  item(PLACE, "Eastside Soccer Field", ["soccer", "parks"], "teens", "latam", 0.58, { es: "Cancha de Fútbol Eastside", ...l(0.0055, 0.0046), address: "Lorena St (demo)" }),
  item(PLACE, "Abuela's Pupusería", ["family-dinner", "street-food"], "all", "latam", 0.64, { es: "Pupusería de la Abuela", ...l(-0.0026, 0.0058), address: "Whittier Blvd (demo)" }),
  item(PLACE, "Plaza Music Corner", ["music-film", "ranchera", "classic-songs"], "elders", "latam", 0.55, { es: "Rincón Musical de la Plaza", ...l(0.0011, -0.0052), address: "Boyle Ave (demo)" }),
];

// ---- UK / London (names are public; places are FICTIONAL) ----
CATALOGUE.push(
  item(TV, "Peppa Pig", ["kids-animation", "family-comedy", "toddler"], "kids", "uk", 0.92),
  item(TV, "Hey Duggee", ["kids-animation", "learning", "comedy"], "kids", "uk", 0.84, { rising: true }),
  item(TV, "Thomas & Friends", ["kids-animation", "adventure", "trains"], "kids", "uk", 0.8),
  item(MOVIE, "Paddington", ["family-film", "adventure", "comedy"], "all", "uk", 0.9),
  item(MOVIE, "Paddington 2", ["family-film", "adventure", "comedy"], "all", "uk", 0.88),
  item(MOVIE, "Mary Poppins", ["family-film", "music-film", "classic-film"], "elders", "uk", 0.86),
  item(MOVIE, "Wallace & Gromit: The Curse of the Were-Rabbit", ["animation", "comedy", "family-film"], "all", "uk", 0.82),
  item(ARTIST, "The Beatles", ["classic-songs", "pop", "family-songs"], "elders", "uk", 0.95),
  item(ARTIST, "Ed Sheeran", ["pop", "family-songs"], "all", "uk", 0.9),
  item(ARTIST, "Little Mix", ["pop", "dance"], "teens", "uk", 0.84),
  item(BRAND, "Walkers", ["snacks", "crisps"], "all", "uk", 0.88),
  item(BRAND, "Ribena", ["drinks", "fruit"], "kids", "uk", 0.8),
  item(BRAND, "Jaffa Cakes", ["biscuits", "snacks", "sweets"], "all", "uk", 0.86),
  item(BRAND, "Haribo", ["sweets", "candy"], "kids", "global", 0.85),
  item(PLACE, "Camden Ice Cream Parlour", ["sweets", "ice-cream"], "kids", "uk", 0.66, { ...uk(0.0015, 0.0012), address: "Parkway (demo)" }),
  item(PLACE, "Regent's Park Playground", ["parks", "play", "family-outing"], "kids", "uk", 0.7, { ...uk(-0.0042, -0.0031), address: "Regent's Park (demo)" }),
  item(PLACE, "Primrose Hill Bakery Corner", ["bakery", "sweets"], "all", "uk", 0.62, { ...uk(0.0025, -0.0044), address: "Regent's Park Rd (demo)" }),
  item(PLACE, "Chalk Farm Fish & Chips", ["family-dinner", "street-food"], "all", "uk", 0.6, { ...uk(0.0038, 0.0021), address: "Chalk Farm Rd (demo)" }),
  item(PLACE, "Camden Library Story Corner", ["learning", "books", "play"], "kids", "uk", 0.5, { ...uk(-0.0022, 0.0035), address: "Crowndale Rd (demo)" }),
  item(PLACE, "Hampstead Heath Kite Hill", ["parks", "family-outing"], "all", "uk", 0.58, { ...uk(0.0068, -0.0052), address: "Hampstead Heath (demo)" }),
);

export const BY_ID = new Map(CATALOGUE.map((c) => [c.id, c]));
