# HomeTiles: communication boards that sound like home

> *"There's more to life than cookies."* (a mother, quoted by AAC researchers Light & McNaughton, 2014)

Non-speaking people (autistic children and adults, people with cerebral palsy, stroke survivors and others) talk by tapping picture tiles on an AAC board. Most boards are generic and Western-designed. A child in Delhi can say "cookie" but not *Parle-G*, their favourite cartoon, or the chaat stall near home.

**HomeTiles is an agent that builds a board around one real person.** It uses Qloo's taste graph to find their real foods, places and favourite things, in their family's language. The board speaks, learns from what gets tapped on the device, and suggests weekly updates that a parent approves.

## What it does
- **Agentic research with Qloo.** An LLM agent (Gemini function calling or the Claude tool runner) decides which Qloo tools to call. A deterministic scripted planner is the fallback.
  - `/search`: resolves favourites to Qloo entities.
  - `/v2/insights`: related shows, games, music and films (with `signal.demographics.age` and `feature.explainability`).
  - **Heatmap → places:** finds where this taste clusters near home (`urn:heatmap`), then searches places inside those hot-spots (`filter.location.geohash`).
  - **Local snacks and brands:** `signal.location.query`.
  - **Who Loves This?:** `urn:demographics` routes tiles to "with cousins" or "with grandparents".
  - **Talk Together:** `/v2/analysis/compare` finds what the child and a grandparent would both enjoy.
  - **What's New:** `/v2/trending` adds rising picks, with a sparkline.
- **A tap-to-speak board.** Hindi, Spanish and English via the Web Speech API. Includes a sentence bar, core and safety words, a "Fun & banter" folder (humour helps AAC users be seen as people), and a family folder.
- **Why this tile?** Every tile shows its Qloo evidence: affinity, distance from home, audience and trend.
- **Without Qloo:** a side-by-side comparison with a generic AI board.
- **Qloo trace:** every call, with its parameters, status, latency and results.
- **Learns on the device.** Taps never leave the browser. "Simulate a week" plus the weekly refresh sends only anonymous entity IDs and counts. Safety, core and family tiles are never changed. Changes apply only after a parent approves.
- **Export** to Open Board Format (`.obf`) for open AAC apps like Cboard (see [cboard#1267](https://github.com/cboard-org/cboard/issues/1267)), or print.

## Run it
```bash
cd hometiles
npm install
cp .env.example .env.local   # keys optional
npm run dev                  # http://localhost:3000
```
With **no keys**, everything runs in **mock mode**: a synthetic catalogue answers the same endpoints in Qloo's documented response shapes. With `QLOO_API_KEY` the app calls `https://hackathon.api.qloo.com`. With `GEMINI_API_KEY` (default `gemini-3.5-flash`) or `ANTHROPIC_API_KEY` (`claude-opus-5-5`) the LLM agent and bilingual labels switch on.

```bash
npm test             # unit tests (ranking, safety rules, OBF, Qloo parsers)
npm run qloo:check   # when the Qloo key arrives: probes every endpoint + India coverage
npm run smoke        # generates a demo board in the terminal
```

## Architecture
See [`docs/SRS.md`](docs/SRS.md) for the requirements, architecture and data model, and [`docs/PLAN.md`](docs/PLAN.md) for the build plan.

```
UI (Next.js) ──NDJSON──► /api/board ─► Agent (Claude tool runner | scripted)
                                        ├─ Qloo facade (live | mock, cache, trace, fallbacks)
                                        ├─ Board engine (ranking, quotas, safety rules, OBF)
                                        └─ Labels (Claude structured output | templates) + ARASAAC
```

## Privacy and safety
- Qloo only receives entity IDs, a city or point, and an age band. Names and sentences never leave the device.
- Demo personas are fictional. HomeTiles supports speech-language therapists; it doesn't replace them. It makes no clinical claims.
- Qloo responses are cached server-side only and never committed (Qloo terms).

## Credits
Taste data: Qloo. Pictograms: Sergio Palao / [ARASAAC](https://arasaac.org), CC BY-NC-SA 4.0 (fetched at runtime, not redistributed). Research behind the design: Johnson et al. 2006; Moorcroft et al. 2020; Gardiner et al. 2025; Light & McNaughton 2014; Weinberg et al., CHI 2025.

MIT licensed.
