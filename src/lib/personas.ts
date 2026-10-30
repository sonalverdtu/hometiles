// FICTIONAL demo personas. No real person's data is used anywhere in the demo (NFR-07).
// qlooIds are resolved at generation time via /search, so they work in both mock and live mode.

import type { Profile } from "./board/types";

export const PERSONAS: Record<string, Profile> = {
  // English is the default language; Leo is the first demo child.
  leo: {
    id: "persona-leo",
    displayName: "Leo",
    ageBand: "24_and_younger",
    isChild: true,
    ageGroup: "child",
    city: "Camden, London",
    home: { lat: 51.539, lon: -0.1426 },
    primaryLang: "en",
    loves: [
      { name: "Bluey", type: "urn:entity:tv_show" },
      { name: "Minecraft", type: "urn:entity:videogame" },
      { name: "Paddington", type: "urn:entity:movie" },
      { name: "Cadbury", type: "urn:entity:brand" },
    ],
    family: [
      { name: "Mum", relation: "mother", loves: [] },
      { name: "Dad", relation: "father", loves: [] },
      {
        name: "Grandma",
        relation: "grandmother",
        loves: [
          { name: "The Beatles", type: "urn:entity:artist" },
          { name: "Mary Poppins", type: "urn:entity:movie" },
        ],
      },
    ],
  },
  aarav: {
    id: "persona-aarav",
    displayName: "Aarav",
    ageBand: "24_and_younger",
    isChild: true,
    ageGroup: "child",
    city: "Rajouri Garden, New Delhi",
    home: { lat: 28.6492, lon: 77.122 },
    primaryLang: "hi",
    secondaryLang: "en",
    loves: [
      { name: "Chhota Bheem", type: "urn:entity:tv_show" },
      { name: "Minecraft", type: "urn:entity:videogame" },
      { name: "Arijit Singh", type: "urn:entity:artist" },
      { name: "Parle-G", type: "urn:entity:brand" },
    ],
    family: [
      { name: "Maa", relation: "mother", loves: [] },
      { name: "Papa", relation: "father", loves: [] },
      {
        name: "Dadu",
        relation: "grandfather",
        loves: [
          { name: "Mohammed Rafi", type: "urn:entity:artist" },
          { name: "Lagaan", type: "urn:entity:movie" },
          { name: "Ramayan", type: "urn:entity:tv_show" },
        ],
      },
      { name: "Riya", relation: "sister", loves: [] },
    ],
  },
  sofia: {
    id: "persona-sofia",
    displayName: "Sofía",
    ageBand: "24_and_younger",
    isChild: true,
    ageGroup: "child",
    city: "Boyle Heights, Los Angeles",
    home: { lat: 34.0333, lon: -118.205 },
    primaryLang: "es",
    secondaryLang: "en",
    loves: [
      { name: "Encanto", type: "urn:entity:movie" },
      { name: "Karol G", type: "urn:entity:artist" },
      { name: "Roblox", type: "urn:entity:videogame" },
      { name: "Takis", type: "urn:entity:brand" },
    ],
    family: [
      { name: "Mamá", relation: "mother", loves: [] },
      {
        name: "Abuela",
        relation: "grandmother",
        loves: [
          { name: "Vicente Fernández", type: "urn:entity:artist" },
          { name: "La Rosa de Guadalupe", type: "urn:entity:tv_show" },
          { name: "Coco", type: "urn:entity:movie" },
        ],
      },
      { name: "Mateo", relation: "brother", loves: [] },
    ],
  },
};
