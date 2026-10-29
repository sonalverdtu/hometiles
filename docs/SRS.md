# HomeTiles: Software Requirements Specification (SRS)

| | |
|---|---|
| Version | 1.0 (hackathon build) |
| Date | 2026-10-29 |
| Event | Qloo Agentic Hackathon (submissions close Oct 30, 2026, 11:45 pm ET) |
| Status | Approved for build |

---

## 1. Introduction

### 1.1 Purpose
This document describes what HomeTiles must do (functional requirements) and how well it must do it (non-functional requirements), the system architecture, the data model and the build plan. It is the single source of truth for development.

### 1.2 Problem statement
Non-speaking people (autistic children and adults, people with cerebral palsy, stroke survivors and others) communicate by tapping picture tiles on an AAC (augmentative and alternative communication) board. Mainstream boards are generic and Western-designed. A child in Delhi can say "cookie" but not the snack she actually eats, her favourite cartoon, or the chaat stall near home.

Verified evidence (see `../../qloo-ideation-report.md` §12):
- Families abandon AAC systems after **poor fit, little training and little follow-up** (Johnson et al. 2006; Moorcroft et al. 2020; Gardiner et al. 2025).
- **Keeping vocabulary current by hand is a burden on parents.** Without extensive training, parents could not add new vocabulary (Moorcroft et al. 2020).
- The theme "doesn't fit and doesn't work for us" appeared in 8 of 11 parent studies: AAC lacks cultural and linguistic responsiveness (Gardiner et al. 2025).
- Speech therapists asked the open-source AAC app Cboard for culture-specific tiles ([cboard#1267](https://github.com/cboard-org/cboard/issues/1267), open since 2022).
- The field says communication must go beyond "needs and wants": *"There's more to life than cookies."* (Light & McNaughton 2014). Users value humour (Weinberg et al., CHI 2025).

### 1.3 Product vision
**HomeTiles is an agent that builds a communication board around one real person: their foods, their places, their favourite things, in their family's language.** The board speaks, learns from what gets tapped, and refreshes itself. A parent approves each change.

### 1.4 Scope
**In scope (hackathon build):**
- Intake.
- Agentic board generation grounded in Qloo.
- A tap-to-speak board player (bilingual).
- Explanations for every tile.
- A "Without Qloo" comparison.
- On-device tap logging with a weekly refresh that needs parent approval.
- Advanced Qloo features: compare, heatmap, trending and demographics.
- Export to Open Board Format (`.obf`) and a printable board.
- A hosted demo with mock mode.

**Out of scope:**
- Replacing core-vocabulary systems or speech therapists.
- Switch scanning and eye-gaze access.
- Native mobile apps.
- User accounts and cloud sync.
- Clinical claims.

### 1.5 Definitions
| Term | Meaning |
|---|---|
| AAC | Augmentative and alternative communication |
| Tile | One button on a board: a picture plus a label; tapping it speaks |
| Core tiles | High-frequency words ("I", "want", "more", "stop"). Fixed position, never auto-removed |
| Safety tiles | Rarely used but vital ("help", "pain", "toilet"). Locked |
| Rotating slots | Board positions the agent may refresh |
| SLP | Speech-language pathologist (speech therapist) |
| Mock mode | The app runs on synthetic, Qloo-shaped data when no API key is set |
| OBF | Open Board Format, an open JSON format for AAC boards (`.obf` / `.obz`) |
| Entity | A Qloo item (movie, artist, place, brand, TV show, video game, etc.) with a Qloo ID |

### 1.6 References
- Qloo Agentic Hackathon rules: https://qloo.devpost.com/rules
- Qloo hackathon developer guide: https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide
- Qloo Insights, demographics, heatmap, compare and trending docs (docs.qloo.com)
- Open Board Format: https://www.openboardformat.org
- ARASAAC pictograms API: https://arasaac.org (CC BY-NC-SA 4.0)
- Research findings: `qloo-ideation-report.md` §12

---

## 2. Overall description

### 2.1 Users and personas
| Persona | Goal | Interaction |
|---|---|---|
| **Parent / caregiver** (primary operator) | A board that fits their child's real life, without hours of setup | Fills in the intake, approves weekly changes, prints or exports |
| **AAC user** (primary beneficiary) | Say what they actually want, talk about what they love, joke | Taps tiles; the board speaks |
| **Speech therapist (SLP)** | Faster personal vocabulary for a client, with reasons they can trust | Reviews "why this tile", locks tiles, exports to the client's AAC app |
| **Judge** (hackathon) | See Qloo making the difference | Runs the demo, opens the Without Qloo toggle and the Qloo trace panel |

### 2.2 Operating environment
- **Client:** a modern browser (Chrome, Edge, Safari or Firefox) on a phone, tablet or laptop. The board player is touch-first.
- **Server:** Next.js 16 on Vercel (Node runtime) with serverless API routes.
- **External services:**
  - Qloo hackathon API (`https://hackathon.api.qloo.com`)
  - Anthropic Claude API
  - ARASAAC pictogram API
  - The browser's Web Speech API (on the device)

### 2.3 Design and implementation constraints
- C1: The Qloo key works **only** against `hackathon.api.qloo.com`, sent as the `X-Api-Key` header, with GET plus query parameters.
- C2: **No Qloo response data may be committed to the public repo.** Caching is server-side only. Mock fixtures are synthetic.
- C3: Do not use the legacy `/recommendations` or `/recs` endpoints.
- C4: The submission must have a live hosted demo, a public repo with an OSI license (MIT) visible in the About section, and a text description.
- C5: The build must work **without any API keys** (mock mode), because the key may arrive late.
- C6: Code is MIT. ARASAAC pictograms are CC BY-NC-SA, fetched at runtime, never committed, and attributed in the UI.

### 2.4 Assumptions and dependencies
- A1: Qloo `/search` resolves common entities. India coverage is **unverified**; the hour-0 checks confirm it.
- A2: `urn:demographics`, `urn:heatmap`, `/v2/analysis/compare` and `/v2/trending` may or may not be enabled for hackathon keys. Each has a fallback (§3.7).
- A3: The Web Speech API has Hindi (`hi-IN`) voices on most Android and Chrome devices. If none exist, the board falls back to English or to text only.

---

## 3. Functional requirements

Priority: **P0** = must ship, **P1** = needed to impress judges, **P2** = if time allows.

### 3.1 Intake (FR-1xx)
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-101 | Create a profile: display name, age band (Qloo bands: `24_and_younger`, `25_to_29` … `55_and_older`, plus a child flag), city or neighbourhood, optional home point (lat/lon), primary and secondary language (en, hi, es) | P0 | The form validates and the profile is saved on the device |
| FR-102 | Enter 3–8 "loves" (shows, games, artists, foods/places, brands). Each is resolved to a Qloo entity via `/search` with autocomplete | P0 | Each love shows a match (name, type, image) or "not found, keep as free text" |
| FR-103 | Add family members (name, relation) and, optionally, a family member's loves (for FR-503) | P1 | People tiles are created and locked |
| FR-104 | One-click **demo personas** (e.g. "Aarav, 9, Delhi" and "Sofía, 12, Los Angeles") so judges can try it instantly | P0 | One click fills the intake and generates a board |

### 3.2 Agentic board generation (FR-2xx)
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-201 | A Claude agent orchestrates Qloo tools to build the board. In LLM mode it decides which tools to call; a deterministic scripted planner is the fallback | P0 | The board is produced in both modes. The trace shows the tool calls |
| FR-202 | **Personal expansion:** `/v2/insights` per type (tv_show, video_game, artist, movie, brand) with `signal.interests.entities=<loves>` and `signal.demographics.age=<band>` | P0 | At least 8 personal candidates with affinity scores |
| FR-203 | **Local places:** `filter.type=urn:entity:place` near home (`filter.location` + radius, or the city query) with taste signals | P0 | At least 4 place tiles with distance and reason |
| FR-204 | **Local brands and snacks:** `urn:entity:brand` with the location signal | P0 | At least 3 local brand tiles |
| FR-205 | **Ranking and layout:** score = personal affinity, local affinity, age fit and diversity. Fill rotating slots by category quotas. Core, safety and people tiles are fixed | P0 | Deterministic for the same inputs. No duplicates. Quotas respected |
| FR-206 | **Bilingual labels and phrases:** an LLM writes short tile labels and spoken phrases in both languages (Devanagari for Hindi), "tell" phrases ("Chhota Bheem is my favourite!") and banter lines ("Bheem would beat you!") | P0 | Each tile has both labels. Mock mode uses templates and a dictionary |
| FR-207 | **Pictures:** an ARASAAC pictogram for generic concepts, the Qloo entity image for named entities, and an emoji or initial as the fallback | P0 | Every tile renders an image or a fallback |
| FR-208 | **Explainability:** every Qloo-sourced tile stores its reasons (personal, local, age, shared, trending) with values and source call IDs. Live calls use `feature.explainability=true` | P0 | The "Why this tile?" popover shows its reasons and Qloo numbers |
| FR-209 | **Progress streaming:** generation streams agent steps to the UI (NDJSON) | P1 | The user sees "Finding places near Rajouri Garden…" as it happens |

### 3.3 Board player (FR-3xx)
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-301 | A grid board with folders (Core, Food, My Places, Favourites, Fun & Banter, Family, Talk Together, What's New) | P0 | Folder navigation works. Home and back are always visible |
| FR-302 | **Tap to speak:** tapping a tile speaks its phrase via the Web Speech API in the chosen language | P0 | Speech starts within 150 ms of a tap on a mid-range phone |
| FR-303 | **Sentence bar:** taps build a sentence; Speak, Clear and Backspace buttons | P0 | The sentence is spoken in one utterance |
| FR-304 | A language toggle (primary, secondary, both labels) | P0 | Labels and speech switch instantly |
| FR-305 | **Edit mode** (behind a parent lock): lock, unlock, swap or hide a tile; reorder only rotating tiles | P1 | Locked tiles survive refreshes |
| FR-306 | Works offline after generation (board, images and labels cached on the device) | P1 | Turning wifi off doesn't break tapping or speech |

### 3.4 Learning and refresh (FR-4xx)
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-401 | **Tap logging on the device:** tile ID, timestamp. Never leaves the device except as aggregated counts per entity ID | P0 | Logs are in local storage; the network tab shows no sentences sent |
| FR-402 | **Weekly refresh:** send the top-tapped entity IDs (weighted) and the unused rotating tiles; the agent returns suggestions (add, replace, move) with reasons | P0 | Suggestions list shows "add X, replace Y, because…" |
| FR-403 | **Parent approval:** suggestions apply only after "Approve" (all or per item) | P0 | Nothing changes without approval |
| FR-404 | **Safety rules:** never auto-remove core, safety, people or locked tiles. Never move fixed tiles. An unused tile gets moved once before it is removed | P0 | Unit tests enforce these rules |
| FR-405 | **"Simulate a week"** demo button: generates a realistic tap log, then runs the refresh | P0 | Judges see the refresh in about 10 seconds |

### 3.5 Advanced Qloo features (FR-5xx)
| ID | Requirement | Pri | Qloo |
|---|---|---|---|
| FR-501 | **Who Loves This?**: for each candidate entity, its demographic skew routes it to a conversation folder ("With cousins" if under-25s skew high; "With Nani/Dadu" if 55+ skews high), and age-mismatched picks are flagged | P1 | `filter.type=urn:demographics&signal.interests.entities=<id>` |
| FR-502 | **My Places via heatmap:** a heatmap of the person's taste around home; pick the hot cells near home; search places inside those cells; show a mini map | P1 | `urn:heatmap` → `urn:entity:place` with `filter.location.geohash` |
| FR-503 | **Talk Together:** compare the person's loves with a family member's loves; shared entities and genres become "Let's ___ together" tiles | P1 | `/v2/analysis/compare` with `a.` and `b.signal.interests.entities` |
| FR-504 | **What's New:** a rotating tile slot for candidates that are rising (trending velocity), with a sparkline | P2 | `/v2/trending` + `bias.trends` |
| FR-505 | **Interest drift:** compare last period's top-tapped entities with this period's; show a drift note to the parent | P2 | `/v2/analysis/compare` |

### 3.6 Transparency, comparison and export (FR-6xx)
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-601 | **Without Qloo toggle:** generate an LLM-only board from the same intake and show it side by side, highlighting what Qloo added (real nearby places, related entities, local brands) | P0 | The toggle shows both boards plus a diff summary |
| FR-602 | **Qloo trace panel:** every Qloo call (endpoint, parameters with the key redacted, status, ms, result count, top names, mode live or mock) | P0 | The panel lists every call for the current board |
| FR-603 | **Export `.obf`** (Open Board Format JSON, with images as URLs), plus `.obz` (zip) | P0 / P2 | The file validates against the OBF structure and imports into Cboard (checked manually) |
| FR-604 | A **printable board** (A4 and Letter) with print CSS | P1 | Print preview shows a clean grid |
| FR-605 | An **attribution footer**: ARASAAC (CC BY-NC-SA), "Powered by Qloo", and a mock-mode banner when relevant | P0 | Visible on every page |

### 3.7 Mock and live modes (FR-7xx)
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-701 | `QLOO_MODE=auto|mock|live`. `auto` runs live when `QLOO_API_KEY` is set and mock otherwise | P0 | `/api/status` reports the mode |
| FR-702 | The mock Qloo client returns synthetic data in the **documented response shapes** for search, insights, demographics, heatmap, compare and trending | P0 | The same adapters parse mock and live data |
| FR-703 | **Per-endpoint fallback:** if a live endpoint returns 403/404/empty, use its fallback (compare → per-person scoring maximin; heatmap → place radius search; trending → `bias.trends`; demographics → the age-signal bias only) and record it in the trace | P0 | No crash. The trace shows "fallback used" |
| FR-704 | `LLM_MODE=auto|mock|live`. With no Anthropic key, the scripted planner and template labels are used | P0 | Full flow works with no keys |
| FR-705 | A **Qloo check script** (`npm run qloo:check`) runs the 5 hour-0 checks and prints a capability report | P0 | It prints pass or fail per endpoint plus India coverage |

### 3.8 Child mode and the two boards (FR-8xx, added v1.1)
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| FR-801 | **Child lock**: "Give to <name>" opens a full-screen board with every menu hidden. The browser back button is blocked, and a refresh reopens it locked | P0 | A child can't reach parent tools or other pages |
| FR-802 | **Parent exit**: press and hold the lock for 2 seconds. A quick tap does nothing | P0 | Tested: a tap stays locked; a 2 s hold unlocks |
| FR-803 | **"For me" smart board**: one screen of predicted tiles, learned on the device from the tap log. Signals: what follows the last word (word pairs), time of day, frequency this week, cold-start hints ("go" → places), and taste score. Category mix enforced | P0 | After "I want", the child's usual snacks and shows come first (unit test) |
| FR-804 | **"Said before"**: whole past sentences, repeatable in one tap | P0 | Visible on the smart board after speaking |
| FR-805 | **"All words" classic board**: fixed folders, big Back button, nothing moves | P0 | Folder → tiles → Back works on a phone |
| FR-806 | Core words keep the same place on both boards (motor planning). The smart board shows the 7 most-used core words plus "help" on phones | P0 | Core row is identical across visits |
| FR-807 | **Natural sentences**: "I + want + Parle-G" speaks "मुझे पारले-जी चाहिए" (grammatical, not word-by-word) | P0 | Verified in the landing demo |
| FR-808 | The parent view shows a live preview of exactly what the child sees, plus settings (which board, tile size M/L/XL, labels, speak-on-tap) | P0 | Settings apply to both the preview and child mode |

---

## 4. Non-functional requirements

| ID | Category | Requirement | Measure |
|---|---|---|---|
| NFR-01 | Performance | Board generation (live) | p50 ≤ 25 s, p95 ≤ 45 s. Mock ≤ 3 s. Progress shown within 1 s |
| NFR-02 | Performance | Tap-to-speech latency | ≤ 150 ms. Tile render ≤ 16 ms per frame |
| NFR-03 | Performance | Qloo calls run in parallel where independent; server cache (LRU, 24 h) keyed by normalised parameters | Repeat generation ≥ 3× faster |
| NFR-04 | Reliability | Every external call has a timeout (Qloo 8 s, LLM 60 s), 1 retry on 5xx or network errors, and a fallback | No unhandled promise rejections. The demo never shows a blank screen |
| NFR-05 | Availability | The board works offline after generation | Manual check in airplane mode |
| NFR-06 | Privacy | No names, ages or free text go to Qloo; only entity IDs, tag IDs, a city or point, and an age band. Tap logs stay on the device; refresh sends only aggregated counts per entity ID | Code review plus a network-tab check |
| NFR-07 | Privacy | No real children's data in the demo. Demo personas are fictional | The README says so |
| NFR-08 | Security | API keys live only in server env vars and are never shipped to the client or logged. The trace redacts headers | grep the build output for the key → none |
| NFR-09 | Security | All API route inputs are validated with zod; payloads are capped (≤ 32 KB); simple per-IP rate limit (30 requests/min) | Invalid input → 400 |
| NFR-10 | Accessibility | WCAG 2.1 AA on operator screens. Board tiles ≥ 64×64 px at the default size (adjustable to 3, 4, 5 or 6 columns), contrast ≥ 4.5:1, visible focus, keyboard operable, no time limits, `aria-label` on tiles | Lighthouse a11y ≥ 95 |
| NFR-11 | Accessibility | Respect `prefers-reduced-motion`; no flashing | Manual check |
| NFR-12 | i18n | UI and tiles in en, hi and es. Hindi in Devanagari (Noto Sans Devanagari). Speech languages `en-IN`/`en-US`, `hi-IN`, `es-ES`/`es-MX` | The language toggle works |
| NFR-13 | Usability | A new user generates a demo board in ≤ 2 clicks and a custom board in ≤ 2 minutes | Hallway test |
| NFR-14 | Responsiveness | Works from 360 px phones to desktop; no horizontal scroll | Manual check at 360, 768 and 1280 px |
| NFR-15 | Maintainability | TypeScript strict; modules separated (qloo / agent / board / ui); no `any` in core libraries | `tsc --noEmit` passes |
| NFR-16 | Testability | Unit tests for ranking, layout safety rules, the OBF export and the Qloo adapters (fixtures) | `npm test` is green |
| NFR-17 | Compliance | No Qloo data in git (cache in memory or `/tmp` only; `.gitignore`). MIT LICENSE. ARASAAC attribution | Repo audit |
| NFR-18 | Observability | Structured server logs per call (endpoint, ms, status), plus the trace panel in the UI | Visible in Vercel logs |
| NFR-19 | Cost | Claude Opus 5.5 at `effort: low` for labels and `low`–`medium` for the agent; prompt caching on the stable system prompt and tools | Under $0.10 per board estimated |
| NFR-20 | Safety | A board is someone's voice: refresh never removes safety, core or people tiles; it always needs parent approval | Unit tests (FR-404) |

---

## 5. System architecture

### 5.1 Overview
```
┌──────────────────────────── Browser (phone / tablet / laptop) ────────────────────────────┐
│  Next.js React UI                                                                          │
│  ├─ Intake wizard ─► POST /api/board (NDJSON stream of agent steps + final board)          │
│  ├─ Board player (grid, sentence bar, Web Speech API TTS)                                  │
│  ├─ Why-this-tile popover · Qloo trace panel · Without-Qloo compare view                   │
│  ├─ Edit mode (parent lock) · Weekly refresh review (approve / reject)                     │
│  └─ Local store (localStorage): profiles, boards, tap log  ◄── never leaves device raw     │
└───────────────────────────────────────────┬───────────────────────────────────────────────┘
                                            │ HTTPS (JSON / NDJSON)
┌───────────────────────────── Next.js API routes (Vercel, Node) ───────────────────────────┐
│  /api/status   /api/resolve   /api/board   /api/baseline   /api/refresh   /api/pictogram    │
│        │                          │                                                         │
│        ▼                          ▼                                                         │
│  ┌──────────────┐      ┌──────────────────────────────┐      ┌───────────────────────┐     │
│  │ Qloo client  │◄─────│  Agent orchestrator          │─────►│ Board engine          │     │
│  │ live | mock  │      │  LLM mode: Claude tool runner│      │ ranking · layout ·    │     │
│  │ cache · trace│      │  Scripted mode: fixed plan   │      │ safety rules · OBF    │     │
│  │ fallbacks    │      └──────────────┬───────────────┘      └───────────────────────┘     │
│  └──────┬───────┘                     │                                                     │
│         │                             ▼                                                     │
│         │                  ┌──────────────────────┐   ┌──────────────────────┐              │
│         │                  │ LLM client (Claude)  │   │ Pictogram service    │              │
│         │                  │ live | mock(template)│   │ ARASAAC + fallback   │              │
│         │                  └──────────────────────┘   └──────────────────────┘              │
└─────────┼───────────────────────────────────────────────────────────────────────────────────┘
          ▼
  hackathon.api.qloo.com  (search · v2/insights · urn:demographics · urn:heatmap ·
                           v2/analysis/compare · v2/trending · v2/tags)
```

### 5.2 Technology choices
| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | One deployable unit for UI and API; keys stay server-side; Vercel hosting |
| Styling | Tailwind CSS v4 | Fast, consistent, responsive |
| Validation | zod | Validates API inputs and Claude tool schemas (`betaZodTool`) |
| LLM | Claude Opus 5.5 (`claude-opus-5-5`) through `@anthropic-ai/sdk`: the tool runner for the agent, and `messages.parse` + `zodOutputFormat` for labels | Tool use and structured outputs |
| TTS | Web Speech API | Free, offline-capable, multilingual |
| Pictograms | ARASAAC REST API | Free AAC symbol set, widely used in Spanish-speaking AAC |
| Storage | localStorage (client); in-memory LRU (server cache) | Privacy-first; no database needed |
| Tests | Vitest | Fast TypeScript unit tests |
| Hosting | Vercel (free tier) | Required live demo |

### 5.3 Module layout
```
hometiles/
├─ docs/                      SRS.md · PLAN.md
├─ scripts/qloo-check.ts      hour-0 capability checks (FR-705)
├─ src/
│  ├─ app/
│  │  ├─ page.tsx             landing + demo personas
│  │  ├─ create/page.tsx      intake wizard
│  │  ├─ board/page.tsx       board player + panels (board loaded from local store)
│  │  └─ api/{status,resolve,board,baseline,refresh,pictogram}/route.ts
│  ├─ lib/
│  │  ├─ config.ts            env + modes
│  │  ├─ qloo/                types · client (live) · mock · cache · trace · fallbacks · index (facade)
│  │  ├─ llm/                 claude.ts (live) · templates.ts (mock)
│  │  ├─ agent/               tools.ts · orchestrator.ts (LLM) · scripted.ts · steps.ts
│  │  ├─ board/               types · core-vocab · ranking · layout · safety · refresh · obf · baseline
│  │  ├─ pictograms.ts
│  │  └─ personas.ts          fictional demo personas
│  └─ components/             Tile · BoardGrid · SentenceBar · WhyPopover · TracePanel · CompareView · RefreshReview · IntakeForm
└─ tests/                     ranking · safety · obf · qloo-adapters
```

### 5.4 Main sequence: generate a board
1. The UI POSTs `/api/board` with the profile (loves already resolved to Qloo IDs where possible).
2. The orchestrator starts and streams `step` events.
3. Tools run, in parallel where possible:
   - `expand_personal_taste` (insights ×5 types)
   - `audience_profile` (demographics per candidate)
   - `find_local_places` (heatmap → places)
   - `find_local_brands`
   - `shared_with_family` (compare)
   - `whats_rising` (trending)
4. The board engine ranks the candidates and fills the layout (core, safety and people tiles are fixed; rotating slots are filled by quota).
5. The LLM writes bilingual labels, tell phrases and banter (structured output). Mock mode uses templates.
6. Pictogram lookup.
7. Stream the final `board` event (board + trace). The UI saves it on the device.

### 5.5 Refresh sequence
1. The UI aggregates the tap log into `{entityId or tileId → count}`.
2. POST `/api/refresh` with the board summary and counts.
3. Top entities (weighted) → insights for new candidates. Unused rotating tiles → the move-or-replace policy. Drift → compare(previous, current).
4. Return suggestions with reasons.
5. The parent approves. The UI applies the changes on the device.

### 5.6 Agent tools (Claude tool runner, `betaZodTool`)
| Tool | Input | Output (compact JSON) |
|---|---|---|
| `expand_personal_taste` | types[], take | candidates[{id, name, type, affinity, tags, image}] |
| `find_local_places` | radius_m, use_heatmap | places[{id, name, distance_m, affinity, geohash, reasons}] |
| `find_local_brands` | take | brands[...] |
| `audience_profile` | entity_ids[] | {id → {age skew, top band}} |
| `shared_with_family` | member | shared[{id, name, type, score_a, score_b}] |
| `whats_rising` | entity_ids[] | rising[{id, velocity, sparkline}] |
| `compose_board` | tile picks + labels + phrases + banter | validated board draft → engine |

The agent is told the board's slot budget and category quotas. It must call `compose_board` exactly once. Prompt steering and `strict: true` are used because forced `tool_choice` is unavailable on Opus 5.5.

---

## 6. Data model (TypeScript)
```ts
type Lang = "en" | "hi" | "es";
type AgeBand = "24_and_younger" | "25_to_29" | "30_to_34" | "35_to_44" | "45_to_54" | "55_and_older";
interface EntityRef { qlooId?: string; name: string; type: QlooType; image?: string }
interface Profile { id; displayName; ageBand: AgeBand; isChild: boolean; city: string;
  home?: { lat: number; lon: number }; primaryLang: Lang; secondaryLang?: Lang;
  loves: EntityRef[]; family: { name: string; relation: string; loves: EntityRef[] }[] }
interface Reason { kind: "personal"|"local"|"age"|"shared"|"trending"|"audience"|"core";
  text: string; value?: number; callId?: string }
interface Tile { id; kind: "core"|"safety"|"people"|"rotating"; category: Category;
  label: Record<Lang,string>; speak: Record<Lang,string>; image?: { url; source: "arasaac"|"qloo"|"emoji" };
  emoji?: string; entity?: EntityRef & { affinity?: number }; locked: boolean;
  partner?: "friends"|"elders"|"everyone"; reasons: Reason[]; score?: number }
interface Folder { id; category: Category; title: Record<Lang,string>; tileIds: string[] }
interface Board { id; profileId; version: number; createdAt; mode: { qloo: "live"|"mock"; llm: "live"|"mock" };
  tiles: Record<string, Tile>; folders: Folder[]; home: string[]; trace: TraceEntry[] }
interface TraceEntry { id; tool; endpoint; params: Record<string,string>; status: number|"fallback"|"error";
  ms: number; count: number; top: string[]; mode: "live"|"mock"; note?: string }
interface TapEvent { tileId: string; ts: number }
interface Suggestion { action: "add"|"replace"|"move"; tile?: Tile; targetTileId?: string; reason: string }
```

## 7. External interfaces

### 7.1 Internal REST API
| Method & path | Body | Returns |
|---|---|---|
| GET `/api/status` | — | `{ qlooMode, llmMode, baseUrl }` |
| POST `/api/resolve` | `{ query, types? }` | `{ results: EntityRef[] }` |
| POST `/api/board` | `{ profile }` | NDJSON: `{type:"step",...}` …, then `{type:"board", board}` |
| POST `/api/baseline` | `{ profile }` | `{ tiles: Tile[] }` (LLM-only, no Qloo) |
| POST `/api/refresh` | `{ profile, board, counts }` | `{ suggestions, drift?, trace }` |
| GET `/api/pictogram?q=&lang=` | — | `{ url? }` |

### 7.2 Qloo endpoints used
`/search` · `/v2/insights` (entity types, `urn:demographics`, `urn:heatmap`) · `/v2/analysis/compare` · `/v2/trending` · `/v2/tags` (optional). Header `X-Api-Key`; base URL from `QLOO_BASE_URL`.

### 7.3 Environment variables
```
QLOO_API_KEY=            # empty → mock mode
QLOO_BASE_URL=https://hackathon.api.qloo.com
QLOO_MODE=auto           # auto | mock | live
ANTHROPIC_API_KEY=       # empty → scripted agent + template labels
LLM_MODE=auto            # auto | mock | live
LLM_MODEL=claude-opus-5-5
```

---

## 8. Risks and mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Qloo key arrives late | Can't demo live | Mock mode (C5), Discord request, one env switch |
| Demographics or heatmap blocked on hackathon keys | Fewer advanced features | Fallbacks (FR-703); the trace shows them honestly |
| Thin India coverage in Qloo | A weak Delhi demo | Second demo persona (Los Angeles, es/en); detect coverage with `qloo:check` |
| LLM latency or cost | Slow demo | Effort `low`; parallel tools; cache; scripted fallback |
| Hindi TTS voice missing on a device | Silent tiles | Fall back to English speech; label stays visible |
| Cboard import incompatibility | Export fails | Print board fallback; validate the OBF structure |
| Judges say "an LLM could do this" | Lower idea score | The Without Qloo toggle plus trace evidence |

## 9. Acceptance and demo script (judges, 60 seconds)
1. Landing → **"Try Aarav (Delhi)"**. Agent steps stream; the board appears.
2. Tap "मुझे चाहिए" (I want) + a nearby chaat place tile. It speaks in Hindi.
3. Open **"Why this tile?"** to see the Qloo affinity, distance and source call.
4. Toggle **Without Qloo**: the generic board vs ours, with the diff highlighted.
5. **Talk Together** folder: tiles shared with Dadu (compare).
6. **Simulate a week** → refresh suggestions → **Approve** → the board updates.
7. **Export .obf** / **Print**.

## 10. Traceability
FR-1xx → intake UI · FR-2xx → `lib/agent`, `lib/board` · FR-3xx → components · FR-4xx → `lib/board/refresh`, `safety` · FR-5xx → `lib/qloo` + agent tools · FR-6xx → panels and export · FR-7xx → `lib/qloo/index`, `scripts/qloo-check.ts` · NFRs → see the plan's verification checklist.
