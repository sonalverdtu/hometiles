# Devpost submission draft: HomeTiles

**Name:** HomeTiles
**Tagline (elevator pitch, 181/200):** Help non-speaking children speak in their own words. An AI agent uses Qloo's taste graph to build a talking picture board from the snacks, shows, places and family each child loves.

**Demo URL:** https://hometiles.vercel.app · **Repo:** https://github.com/sosodtu/hometiles · **License:** MIT

---

## Inspiration
When we were little, my younger cousin couldn't speak. She talked to us by tapping pictures on a communication board.

The board had the basics: *eat*, *drink*, *cookie*, *park*. What it didn't have was her. Not the snack she actually wanted, not the cartoon she watched every day, not the places we went or the people she loved. The things she wanted to tell us about, day to day, simply weren't on it. So she pointed, we guessed, and too often we guessed wrong.

Adding her words wasn't easy either. Every new tile meant finding a picture, making the tile and squeezing it onto the board, and what she loved changed faster than any of us could keep up. Her board stayed generic. Her world didn't.

HomeTiles is the board I wish she'd had. It knows what *this* child loves, finds a picture for every tile by itself, and keeps up when that changes.

Our family wasn't unusual, as it turns out. Non-speaking children (autistic kids, children with cerebral palsy, and many others) talk by tapping pictures on an AAC board, and most of those boards are generic. *"There's more to life than cookies,"* one mother said about her child's board; AAC researchers Light & McNaughton quoted her in 2014. The research keeps finding the same thing:
- Families give up on AAC when it doesn't fit their life and support is thin.
- Parents struggle to keep vocabulary up to date by hand.
- In a 2025 review, "doesn't fit and doesn't work for us" (cultural and language mismatch) came up in 8 of 11 parent studies.
- Speech therapists have been asking the open-source AAC app Cboard for culture-specific tiles since 2022 ([cboard#1267](https://github.com/cboard-org/cboard/issues/1267)).

That gap is about taste and culture. Which made it a job for Qloo.

## What it does
**A parent answers a few questions.** The child's first name and age, where they live, the language spoken at home (English by default; Hindi and Spanish too, with an optional second language), 3–5 things the child loves, what the child is like if they want to say (energetic, calm, shy, curious, sporty, creative or funny, up to two), and who's in the family. The name never goes to the AI or to Qloo.

**Then an AI agent goes and researches that one child with Qloo**, and you can watch it work. Each step shows up as it happens, with the child's profile right next to it so the parent can check the agent got things right. When the board is ready, it waits. Nothing opens until the parent (or a judge reading along) taps "Open board". In about a minute it has:
- The child's own favourites, first and locked. If they love Bluey, there's a Bluey tile that no refresh will ever take away.
- More shows, games and music they're likely to love, with Qloo's explanation of why. If a parent has favourite singers, up to two songs that may already be playing at home.
- Shows and films that fit the child's temperament, picked with Qloo's descriptor tags ("calm", "energetic", "silly").
- Real places near home. A Qloo heatmap finds where this child's kind of taste clusters, the agent searches for places inside those hot-spots, and it always adds a park, playground or zoo nearby.
- Snacks and drinks that fit the child and are popular locally. The AI also suggests local brands, and only the ones Qloo can actually find stay on.
- Toys. Qloo has no "toys" genre, but toy makers carry each other as competitor tags, so the agent asks for brands near Mattel, Hasbro and LEGO that fit the child's favourites. For Leo (Bluey, Minecraft) that's LEGO and Toca Boca.
- Things to talk about with Grandma: Qloo compare finds songs and films they'd both enjoy, so the board has conversation starters as well as requests.
- Who loves what: Qloo demographics marks a tile as a topic for cousins or for grandparents.
- What's new: Qloo trending adds rising picks, so the child can join in when everyone at school is talking about something.

**On top of that, every board gets about 100 everyday words.** I noticed this late, while testing: a board built only from a taste graph can't say "water", "school" or "red". So, in the spirit of Cboard's starter boards, each folder now has the basics after the child's own tiles: water, milk, roti and dal on Hindi boards, tortilla on Spanish ones, home, school, doctor, ball, crayons, the colours, feelings, body parts (so "my tummy hurts" is possible), and chat words like hello, my turn, what? and again. Each has an ARASAAC pictogram and a label in all three languages. Parle-G still comes before "biscuit".

**The child gets a board that talks.**
- *For me* is the smart board. It learns on the device what the child says and when: after "I want" it shows their usual snacks, in the evening their cartoons. It follows the conversation, too. Talk about Grandma and the things the child shares with her come up; say "go" and nearby places appear. A row of action words follows the last tap (a snack brings up eat and drink, a place brings up go and wait, a show brings up watch). Only a few tiles change at a time, so the child can still find things. Two drawers under the core words, *I need* and *More words*, keep every safety word and core word one tap away.
- *All words* is the classic board: fixed folders where nothing moves, which many therapists prefer while a child is learning. Core words sit in the same spot on both boards, and a small "?" explains the difference to parents.
- Speech sounds like a sentence: "I + want + Cadbury" says "I want Cadbury", and "I + want + Parle-G" says "मुझे पारले-जी चाहिए" in proper Hindi word order. It picks the gentlest voice the device has, a natural female voice where there is one, slightly slower and softer. If a phone has no Hindi or Spanish voice, it says the English instead of going silent.
- There are jokes about their favourites, too. AAC users say humour helps people "see that I am a person".

**And the parent stays in charge.**
- "Give to Leo" goes full-screen. While it's locked, every page leads back to the board, the menus disappear, and long-press menus are blocked. A parent exits by holding the lock for 2 seconds.
- The board checks every Qloo result against the child's age group (under 8, 8–12, teen): no energy drinks, coffee chains, M-rated games, explicit rap or grown-up dramas on a child's board, and no hotels in anyone's places.
- Every tile can explain why it's there (Qloo affinity, distance from home, temperament tags, audience, trend). If a parent thinks a tile is wrong, they can remove it and say why: misleading, not relevant, not appropriate, too far, they don't like it. The reason is kept, and the weekly refresh won't bring it back.
- The weekly refresh suggests changes from what was actually tapped, and the parent approves each one. Safety, core and family tiles are never changed automatically.
- A "With vs without Qloo" view and a trace of every Qloo call show exactly what Qloo added.
- Boards export to Open Board Format (`.obf`) for open AAC apps like Cboard, or print as a paper board.

## How we use Qloo
![How the agent uses Qloo for one child: each favourite is resolved, then insights, temperament tags, heatmap, brands, compare, demographics and trending fill the board's folders, and an age screen checks everything](https://raw.githubusercontent.com/sosodtu/hometiles/main/docs/diagrams/qloo-flow.png)

*One child, end to end: from three favourites to a full board. Orange boxes are Qloo calls, green boxes are the board's folders.*

| Need | Qloo |
|---|---|
| Resolve favourites | `/search` |
| Related favourites, with reasons | `/v2/insights` (tv_show, videogame, artist, movie), `signal.demographics.age`, `feature.explainability` |
| Shows and films that fit the child's temperament | `/v2/insights` with `signal.interests.tags` (descriptor tags such as `urn:tag:style:qloo:calm`), `operator.signal.interests.tags=union` |
| Places near home | `urn:heatmap` → `urn:entity:place` with `filter.location.geohash`, plus a point-and-radius search |
| Local snacks and brands | `urn:entity:brand` + `signal.location.query`, and `/search` to check each local brand the LLM suggests |
| Toys | `urn:entity:brand` with `filter.tags` = Qloo's competitor tags for Mattel, Hasbro and LEGO, seeded by the child's favourites |
| Conversation partner and age fit | `urn:demographics` |
| Family overlap | `/v2/analysis/compare` |
| Rising picks | `/v2/trending` + `bias.trends` |
| Weekly learning | the most-tapped entity IDs, fed back as interest signals |

I also learned where Qloo stops. It has no personality model and no child audiences (I tested), so "what the child is like" uses descriptor tags on content, and only for TV and films, because the tags barely moved game or music results. Qloo ignores `filter.content_rating` for video games, so the board checks game ratings itself. And Qloo's signal weights only work within one signal group, so a parent's music is blended in the app and capped at two lighter picks.

## AI alone vs Qloo: what I measured
I asked an LLM on its own (Gemini 3.5 Flash-Lite) to plan boards for 4 children, in Delhi, Boyle Heights (Los Angeles), Camden (London) and Lekki (Lagos): 8 favourites, 6 real kid-friendly places within 2.5 km of home, and 6 snacks each. Then I asked Qloo for the same children and checked every place the LLM named against Qloo's search.

- Places were where Qloo won clearly. The LLM named 24 places and only 10 were real and within 2.5 km. It invented a "Boyle Heights Branch Library" and a "Hanna's Cafe and Playroom" in Lagos, and it put an Eros cinema 400 m from the Delhi home when the nearest one is 14 km away. Qloo returned 32 of 32 real places with addresses, on average 1.3 km from home.
- Snacks and local kids' TV went the other way: the LLM was more personal in 3 of 4 cities. For Delhi it said Haldiram's, Parle Hide & Seek and Motu Patlu, while Qloo's raw results were global brands and US TV-PG dramas.
- Qloo made its own mistakes, too: energy drinks as snacks for an 8- and a 9-year-old (G Fuel, Red Bull), an M-rated game, and adult sitcoms passing as TV-PG. The age screen now removes those.

So the design is simple: the LLM proposes, and Qloo verifies and localises. The LLM suggests local snack brands, and only the ones Qloo finds (with a food tag) become tiles. On live Qloo, Haldiram's made it in Delhi and Ribena in London; Bikanervala, Amul, Fruit Shoot and Freddo weren't in Qloo, so they were dropped rather than invented. Every place, show and song on a board is a real Qloo entity.

## How we built it
![HomeTiles architecture: the parent wizard sends a profile without names to /api/board; the Gemini agent picks Qloo tools; the board engine builds the board; taps stay on the device and only tap counts go to the weekly refresh, which the parent approves](https://raw.githubusercontent.com/sosodtu/hometiles/main/docs/diagrams/architecture.png)

*Green runs on the family's device, orange on our server (Next.js API routes on Vercel), purple is an outside service.*

- Next.js 16 (App Router), TypeScript and Tailwind, hosted on Vercel. The API routes stream every step of the build to the browser.
- The agent is Gemini 3.5 Flash with function calling (the Claude tool runner works too). It chooses which of 7 Qloo tools to call; a deterministic planner fills any gaps and adds toys. The same LLM writes the tile words as structured output, and if it's slow, the board keeps simple template wording rather than making anyone wait.
- A Qloo layer with live and mock modes, a cache, a per-call trace and a fallback for every endpoint.
- The board engine: ranking, category quotas, the age screen, locked safety words, about 100 everyday words, and OBF export.
- One language registry. English is the default; adding a language means one entry there plus its words.
- Predictions run on the device: word pairs, time of day, weekly frequency and the topic of the last few sentences, with a steady row that only changes a few tiles at a time.
- Speech is the Web Speech API, with emoji stripped before speaking. Pictograms come from ARASAAC.
- The landing page tells the story the same way: why I built it, an AI-alone vs AI + Qloo comparison that flips tile by tile, and a scroll-through of how Qloo is used, stage by stage.
- Privacy: names never go to Qloo or to the LLM. The agent sees family relations ("grandmother"), not names. Qloo sees the names of favourites to look up, entity IDs, tags, a city or point and an age band. Taps and sentences stay on the device; the weekly refresh sends an anonymous profile with tap counts.

## Challenges
- Getting the board to speak grammatical Hindi, where the word order isn't the same as English.
- Balancing a board that adapts (helpful) with one that never moves (muscle memory matters a lot in AAC). I ended up with two boards that share the same core-word row.
- Making sure the AI can never remove a safety word or change the board without a parent.
- Keeping a child's board age-appropriate when the taste graph isn't built for children. My first safety screen also threw out every family restaurant in London, because they all carry wine and coffee "offering" tags. Now a place is judged by what it is (its category and genre tags), not by what it serves.
- Realising, late, that personal isn't enough. A board needs "water" and "school" as much as it needs Bluey.

## Accomplishments that we're proud of
- It's real and it's live. A parent can build a full board for their child at https://hometiles.vercel.app in about a minute against live Qloo, in English, Hindi or Spanish. Leo's board, built live: 160 tiles from 63 Qloo calls in 36 seconds.
- Every personal tile is grounded. On Leo's board, every personal favourite, food and place tile (24 of them) is backed by Qloo evidence, and the 6 places are real, about 1 km from home on average (London Zoo, The Regent's Park). Every tile can show why it's there.
- The child stays safe and the parent stays in control. Safety words are always one tap away, nothing changes without a parent's approval, and the age screen catches what Qloo's filters miss.
- I measured instead of assuming (see "AI alone vs Qloo" above), and built what I found into the product.
- It's open: MIT-licensed, 36 automated tests, and boards export to the Open Board Format used by open AAC apps.

## What we learned
Personalising AAC turned out to be less about clever AI and more about taste: the right snack, the right park, the right song to share with Grandma. An LLM knows a city's snacks but makes up its streets. A taste graph knows the real places and what goes with what. Put them together, give the parent the last word on every change, and you get a board that actually fits one child.

## What's next
- Pilots with speech therapists in London, Delhi and Los Angeles.
- A direct Cboard integration (closing cboard#1267).
- More languages (Tamil, Bengali, Portuguese), each one entry in the language registry plus its words.
- An offline-first mode for homes with patchy internet.

## Built with
nextjs · typescript · tailwindcss · qloo · gemini · claude · web-speech-api · arasaac · open-board-format · vercel
