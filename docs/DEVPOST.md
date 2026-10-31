# Devpost submission draft: HomeTiles

**Name:** HomeTiles
**Tagline (elevator pitch, 181/200):** Help non-speaking children speak in their own words. An AI agent uses Qloo's taste graph to build a talking picture board from the snacks, shows, places and family each child loves.

**Demo URL:** https://hometiles.vercel.app · **Repo:** https://github.com/sosodtu/hometiles · **License:** MIT

---

## Inspiration
When we were little, my younger cousin couldn't speak. She talked to us by tapping pictures on a communication board.

The board had the basics: *eat*, *drink*, *cookie*, *park*. What it didn't have was **her**. Not the snack she actually wanted, not the cartoon she watched every day, not the places we went or the people she loved. The things she wanted to tell us about, day to day, simply weren't on it. So she pointed, we guessed, and too often we guessed wrong.

Adding her words wasn't easy either. Every new tile meant finding the right picture, making the tile and fitting it onto the board, and the things she loved kept changing faster than anyone could keep up. Her board stayed generic while her world didn't.

I built HomeTiles for children like her: a board that knows what *this* child loves, finds the picture for every tile by itself, and keeps up when what they love changes.

It turns out our family wasn't unusual. Non-speaking children (autistic kids, children with cerebral palsy and many others) talk by tapping pictures on an AAC board, and most boards are generic. *"There's more to life than cookies,"* one mother said about her child's board, quoted by AAC researchers Light & McNaughton in 2014. The research is consistent:
- Families give up on AAC when it doesn't fit their life and support is thin.
- Parents struggle to keep vocabulary up to date by hand.
- In a 2025 review, "doesn't fit and doesn't work for us" (cultural and language mismatch) came up in 8 of 11 parent studies.
- Speech therapists have asked the open-source AAC app Cboard for culture-specific tiles since 2022 ([cboard#1267](https://github.com/cboard-org/cboard/issues/1267)).

That gap is about taste and culture, so it's a job for Qloo.

## What it does
**1. A parent fills in three short steps:** the child's name and age, where they live and the language spoken at home (English by default, or Hindi or Spanish, with an optional second language), 3–5 things the child loves, what the child is like (optional: up to 2 of energetic, calm, shy, curious, sporty, creative, funny), and who's in the family. The child's name never goes to the AI or to Qloo.

**2. An AI agent researches with Qloo** and builds the board in about a minute:
- **Their own favourites first:** everything the parent typed becomes a tile, locked so no refresh removes it. A child who loves Bluey can always say "Bluey".
- **Favourites:** shows, games and music the child is likely to love, expanded from their own favourites, with Qloo explainability. If a parent has favourite singers, up to 2 songs that may already be playing at home.
- **Fits who they are:** shows and films that match what the child is like, from Qloo's descriptor tags ("calm", "energetic", "silly").
- **My places:** a Qloo **heatmap** finds where this child's kind of taste clusters near home. The agent then searches for real places *inside* those hot-spots, and adds a park, playground or zoo near home for children.
- **Food:** snacks and brands that fit the child's taste and are popular where they live. The LLM also suggests local snack brands, and only the ones Qloo can find are kept.
- **Talk together:** Qloo **compare** finds songs and films the child and a grandparent would both enjoy. That gives conversation tiles, not just request tiles.
- **Who loves this?:** Qloo **demographics** decides whether a tile is a topic for cousins or for grandparents.
- **What's new:** Qloo **trending** adds rising picks, so the child can join the playground conversation.

**3. The child gets a board that talks**, in English, Hindi or Spanish:
- **⭐ For me (smart board):** learns *on the device* what the child says and when. After "I want" it shows their usual snacks and shows. In the evening it brings up their cartoons. It follows the conversation: talk about Grandma and the things they share come up ("💬 Talking about Grandma"); say "go" and places near home come up. At most 3 tiles change at a time, so the child can still find things. Past sentences repeat with one tap. Two drawers under the core words, **I need** and **More words**, keep every safety word and every core word one tap away.
- **📁 All words (classic board):** fixed folders where nothing moves, which many therapists prefer while a child is learning. Core words stay in the same place on both boards.
- **Natural speech:** "I + want + Cadbury" says *"I want Cadbury"*, and "I + want + Parle-G" says *"मुझे पारले-जी चाहिए"* in correct Hindi word order, not word by word. If a phone has no Hindi or Spanish voice, it says the English words instead of going silent.
- **Fun & banter:** jokes about their favourites. AAC users say humour helps others "see that I am a person".

**4. A child lock and a parent who stays in control:**
- "Give to Leo" goes full-screen. While it's locked, every page leads back to the board, the site's header and footer disappear, and long-press menus are blocked. Parents exit by holding the lock for 2 seconds.
- **Safe for their age:** the board screens every Qloo result for the child's age group itself (under 8, 8–12, teen). No energy drinks, coffee chains, M-rated games, explicit rap or grown-up dramas on a child's board, and no hotels in anyone's places.
- **Weekly refresh:** the agent suggests changes based on what was actually tapped. **Parents approve every change.** Safety, core and family tiles are never changed automatically.
- **Transparency:** every tile explains *why it's there* (Qloo affinity, distance from home, temperament tags, audience, trend). A "With vs without Qloo" view and a trace of every Qloo call show exactly what Qloo added.
- **Take it anywhere:** export to Open Board Format (`.obf`) for open AAC apps like Cboard, or print a paper board.

## How we use Qloo
| Need | Qloo |
|---|---|
| Resolve favourites | `/search` |
| Related favourites, with reasons | `/v2/insights` (tv_show, videogame, artist, movie), `signal.demographics.age`, `feature.explainability` |
| Shows and films that fit the child's temperament | `/v2/insights` with `signal.interests.tags` (descriptor tags such as `urn:tag:style:qloo:calm`), `operator.signal.interests.tags=union` |
| Places near home | `urn:heatmap` → `urn:entity:place` with `filter.location.geohash`, plus a point-and-radius search |
| Local snacks and brands | `urn:entity:brand` + `signal.location.query`, and `/search` to check each local brand the LLM suggests |
| Conversation partner and age fit | `urn:demographics` |
| Family overlap | `/v2/analysis/compare` |
| Rising picks | `/v2/trending` + `bias.trends` |
| Weekly learning | the most-tapped entity IDs, fed back as interest signals |

We also learned where Qloo stops. It has no personality model and no child audiences (we tested), so "what the child is like" uses descriptor tags on content, only for TV and films, because the tags barely moved game or music results. Qloo ignores `filter.content_rating` for video games, so we check game ratings ourselves. And its signal weights only work within one signal group, so a parent's music is blended in the app, capped at 2 lighter picks.

## AI alone vs Qloo: what we measured
We asked an LLM on its own (Gemini 3.5 Flash-Lite) to plan boards for 4 children: in Delhi, Boyle Heights (Los Angeles), Camden (London) and Lekki (Lagos). For each, it gave 8 favourites, 6 real kid-friendly places within 2.5 km of home, and 6 snacks. We asked Qloo for the same children, then checked every place the LLM named against Qloo's search.

- **Places: Qloo was far more reliable.** The LLM named 24 places. 10 were real and within 2.5 km. It invented several, such as a "Boyle Heights Branch Library" and "Hanna's Cafe and Playroom" in Lagos, and got distances wrong: it put an Eros cinema 400 m from the Delhi home, but the nearest Eros cinema is 14 km away. Qloo returned 32 of 32 real places with addresses, on average 1.3 km from home.
- **Snacks and local kids' TV: the LLM was more personal in 3 of 4 cities.** For Delhi it named Haldiram's, Parle Hide & Seek and Motu Patlu. Qloo's raw results were global brands and US TV-PG dramas.
- **Qloo's own mistakes, which the app now catches:** energy drinks as snacks for an 8- and a 9-year-old (G Fuel, Red Bull), an M-rated game, and adult sitcoms that pass as TV-PG. Our age screen removes them.

What we take from this: **the LLM proposes, Qloo verifies and localizes.** That's how HomeTiles is built. The LLM suggests local snack brands and only the ones Qloo finds, with a food tag, become tiles. On live Qloo, Haldiram's was kept in Delhi and Ribena in London; Bikanervala, Amul, Fruit Shoot and Freddo weren't found and were dropped. Every place, show and song on the board is a real Qloo entity.

## How we built it
- **Next.js 16 (App Router)** + TypeScript + Tailwind on Vercel.
- **The agent:** an **LLM agent** (Gemini 3.5 Flash function calling; Claude Opus 5.5 tool runner also supported) chooses which of 7 Qloo tools to call. A deterministic planner fills any gaps. The same LLM writes the tile words as structured output.
- **The Qloo facade:** live and mock modes, a server-side cache, a per-call trace, and a fallback for every endpoint.
- **The board engine:** ranking, category quotas, safety rules, the age screen and OBF export.
- **Languages:** one registry file. English is the default; adding a language means one entry there plus its words.
- **On-device prediction:** word pairs, time of day, weekly frequency and the live topic of the last few sentences, mixed across categories, with a steady row that changes at most 3 tiles per update.
- **Speech:** the Web Speech API, with emoji removed before speaking. **Pictograms:** ARASAAC for core words.
- **Privacy:** names never go to Qloo or to the LLM. The agent sees family relations ("grandmother"), not names. Qloo sees the names of favourites and brands to look up, entity IDs, tags, a city or point, and an age band. Taps and sentences stay on the device, and the weekly refresh sends an anonymous profile with tap counts.

## Challenges
- Making the board grammatical in Hindi (word order differs from English).
- Balancing a board that *adapts* (helpful) with one that *never moves* (motor planning). Our answer is two boards with the same core-word row.
- Making sure the AI can never remove a safety word or change the board without a parent.
- Keeping a child's board age-appropriate when the taste graph isn't. The first screen also dropped every family restaurant in London, because they all carry wine and coffee "offering" tags. Now we judge a place by what it is (its category and genre tags), not by what it serves.

## What we learned
Personalising AAC is less about clever AI and more about taste: the right snack, the right place, the right song to share with grandpa. An LLM knows a city's snacks but makes up its streets. A taste graph knows the real places and what goes with what. Used together, with a parent approving each change, they make a board that fits one child.

## What's next
- Pilots with speech therapists in London, Delhi and Los Angeles.
- A direct Cboard integration (closing cboard#1267).
- More languages (Tamil, Bengali, Portuguese), each one entry in the language registry plus its words.
- Offline-first mode for low-connectivity homes.

## Built with
nextjs · typescript · tailwindcss · qloo · gemini · claude · web-speech-api · arasaac · open-board-format · vercel
