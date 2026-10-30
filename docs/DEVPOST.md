# Devpost submission draft: HomeTiles

**Name:** HomeTiles
**Tagline:** A talking picture board that sounds like home. An agent builds AAC boards for non-speaking children from their own foods, places, favourite shows and family, using Qloo's taste graph.

**Demo URL:** _(Vercel URL)_ · **Repo:** _(GitHub URL)_ · **License:** MIT

---

## Inspiration
*"There's more to life than cookies."* A mother said this about her child's communication board, and AAC researchers Light & McNaughton quoted her in 2014.

Non-speaking children (autistic kids, children with cerebral palsy and many others) talk by tapping pictures on an AAC board. Most boards are generic and Western-designed. A boy in Delhi can say "cookie", but not *Parle-G*, not *Chhota Bheem*, and not the chaat stall outside his building.

The research is consistent:
- Families give up on AAC when it doesn't fit their life and support is thin.
- Parents struggle to keep vocabulary up to date by hand.
- In a 2025 review, "doesn't fit and doesn't work for us" (cultural and language mismatch) came up in 8 of 11 parent studies.
- Speech therapists have asked the open-source AAC app Cboard for culture-specific tiles since 2022 ([cboard#1267](https://github.com/cboard-org/cboard/issues/1267)).

That gap is about taste and culture, so it's a job for Qloo.

## What it does
**1. A parent answers three questions:** where they live and the language spoken at home, 3–5 things the child loves, and who's in the family.

**2. An AI agent researches with Qloo** and builds the board:
- **Favourites:** shows, games and music the child is likely to love, expanded from their own favourites, with Qloo explainability.
- **My places:** a Qloo **heatmap** finds where this child's kind of taste clusters near home. The agent then searches for real places *inside* those hot-spots.
- **Food:** snacks and brands that fit the child's taste and are popular where they live.
- **Talk together:** Qloo **compare** finds songs and films the child and their grandfather would both enjoy. That gives conversation tiles, not just request tiles.
- **Who loves this?:** Qloo **demographics** decides whether a tile is a topic for cousins or for grandparents.
- **What's new:** Qloo **trending** adds rising picks, so the child can join the playground conversation.

**3. The child gets a board that talks**, in Hindi, Spanish or English:
- **⭐ For me (smart board):** learns *on the device* what the child says and when. After "I want" it shows their usual snacks and shows. In the evening it brings up their cartoons. Past sentences repeat with one tap, so the child doesn't have to dig through folders.
- **📁 All words (classic board):** fixed folders where nothing moves, which many therapists prefer while a child is learning. Core words stay in the same place on both boards.
- **Natural speech:** "I + want + Parle-G" says *"मुझे पारले-जी चाहिए"* in correct Hindi word order, not word by word.
- **Fun & banter:** jokes about their favourites. AAC users say humour helps others "see that I am a person".

**4. A child lock and a parent who stays in control:**
- "Give to Aarav" goes full-screen and blocks the back button. Parents exit by holding the lock for 2 seconds.
- **Weekly refresh:** the agent suggests changes based on what was actually tapped. **Parents approve every change.** Safety, core and family tiles are never changed automatically.
- **Transparency:** every tile explains *why it's there* (Qloo affinity, distance from home, audience, trend). A "With vs without Qloo" view and a trace of every Qloo call show exactly what Qloo added.
- **Take it anywhere:** export to Open Board Format (`.obf`) for open AAC apps like Cboard, or print a paper board.

## How we use Qloo
| Need | Qloo |
|---|---|
| Resolve favourites | `/search` |
| Related favourites, with reasons | `/v2/insights` (tv_show, video_game, artist, movie), `signal.demographics.age`, `feature.explainability` |
| Places near home | `urn:heatmap` → `urn:entity:place` with `filter.location.geohash`, plus a point-and-radius search |
| Local snacks and brands | `urn:entity:brand` + `signal.location.query` |
| Conversation partner and age fit | `urn:demographics` |
| Family overlap | `/v2/analysis/compare` |
| Rising picks | `/v2/trending` + `bias.trends` |
| Weekly learning | the most-tapped entity IDs, fed back as interest signals |

An LLM alone can guess "Indian kids like samosa". Only the taste graph knows the chaat stall 300 m from this child's home, or which songs he and his grandfather would both love.

## How we built it
- **Next.js 16 (App Router)** + TypeScript + Tailwind on Vercel.
- **The agent:** a **LLM agent** (Gemini 3.5 Flash function calling; Claude Opus 5.5 tool runner also supported) chooses which Qloo tools to call. A deterministic planner fills any gaps. The same LLM writes the bilingual labels as structured output.
- **The Qloo facade:** live and mock modes, a server-side cache, a per-call trace, and a fallback for every endpoint.
- **The board engine:** ranking, category quotas, safety rules and OBF export.
- **On-device prediction:** word pairs, time of day and weekly frequency, mixed across categories.
- **Speech:** the Web Speech API. **Pictograms:** ARASAAC for core words.
- **Privacy:** Qloo only ever sees entity IDs, a city or point, and an age band. Names and sentences stay on the device.

## Challenges
- Making the board grammatical in Hindi (word order differs from English).
- Balancing a board that *adapts* (helpful) with one that *never moves* (motor planning). Our answer is two boards with the same core-word row.
- Making sure the AI can never remove a safety word or change the board without a parent.

## What we learned
Personalising AAC is less about clever AI and more about taste: the right snack, the right place, the right song to share with grandpa. That's exactly what a taste graph knows.

## What's next
- Pilots with speech therapists in Delhi and Los Angeles.
- A direct Cboard integration (closing cboard#1267).
- More languages (Tamil, Bengali, Portuguese).
- Offline-first mode for low-connectivity homes.

## Built with
nextjs · typescript · tailwindcss · qloo · gemini · claude · web-speech-api · arasaac · open-board-format · vercel
