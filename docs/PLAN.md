# HomeTiles: build plan

Deadline: **Oct 30, 2026, 11:45 pm ET = Oct 31, 9:15 am IST.** Freeze code 3 hours before the deadline.

The build runs on **mock mode** until the Qloo key arrives (SRS C5). Each milestone ends in a working, deployable state.

## Milestones
| # | Milestone | FRs | Done when |
|---|---|---|---|
| M0 | Scaffold: Next.js 16 + TS + Tailwind, deps, env, config modes, MIT LICENSE, docs | FR-701, FR-704 | `npm run dev` serves; `/api/status` shows `mock` |
| M1 | **Qloo layer:** types, live client, mock client (documented shapes), cache, trace, per-endpoint fallbacks, `qloo:check` script | FR-701–705 | Adapter tests pass on the mock fixtures |
| M2 | **Board engine:** core and safety vocab (en/hi/es), ranking, layout quotas, safety rules, OBF export, LLM-only baseline | FR-205, FR-404, FR-603, FR-601 | Unit tests for ranking, safety and OBF pass |
| M3 | **Agent:** scripted planner plus Claude tool runner; labels via structured output (with a template fallback); pictograms; NDJSON streaming `/api/board` | FR-201–209 | A demo persona produces a board in mock mode in under 3 s |
| M4 | **UI core:** landing + personas, intake with autocomplete, board player (folders, tap-to-speak, sentence bar, language toggle), local store | FR-101–104, FR-301–304 | A judge can go from landing to a speaking board in 2 clicks |
| M5 | **Transparency:** "Why this tile?", Qloo trace panel, Without Qloo compare view, attribution footer, mock banner | FR-208, FR-601, FR-602, FR-605 | All three panels work |
| M6 | **Learning:** tap log, "Simulate a week", `/api/refresh`, review and approve | FR-401–405 | Refresh suggestions apply only after approval |
| M7 | **Advanced Qloo:** demographics routing, heatmap → places, Talk Together (compare), What's New (trending), drift | FR-501–505 | Each feature is visible in the board, with a fallback in the trace |
| M8 | **Polish and ship:** print view, edit mode, offline, a11y pass, README, Vercel deploy, Devpost text | FR-305, 306, 604, NFRs | The live URL works on a phone |
| M9 | **Key arrives → go live:** `npm run qloo:check`, fix adapters against the real shapes, tune quotas, redeploy | — | Trace shows `live` and real entities |

## Hour-0 checks, when the key arrives (`npm run qloo:check`)
1. `/search?query=Chhota Bheem` and others → do they resolve? (India coverage)
2. `urn:demographics` for one entity → age bands returned?
3. `urn:heatmap` + `filter.location.query=New Delhi` → geohash grid?
4. `/v2/analysis/compare` with two small sets → response shape?
5. `/v2/trending` with one entity over an 8-week window → weekly series?

## Verification checklist (before submission)
- [ ] `npm run build` and `npx tsc --noEmit` are clean; `npm test` is green
- [ ] Full flow with **no keys** (mock): generate → speak → why → compare → simulate week → approve → export
- [ ] Full flow with the **Qloo key** (live): trace entries show `live`
- [ ] Key not present in client bundles (grep `.next/static`)
- [ ] No Qloo data in git (`git grep -i "entity_id"` on the fixtures shows only synthetic IDs)
- [ ] Phone check at 360 px; tiles ≥ 64 px; Hindi renders in Devanagari
- [ ] Lighthouse a11y ≥ 95 on the board page
- [ ] The LICENSE (MIT) is detected by GitHub (About section)
- [ ] Devpost: demo URL, repo URL, description, "How we use Qloo" section

## Submission text skeleton
- **Inspiration:** "There's more to life than cookies."
- **What it does:** see SRS §1.3.
- **How we use Qloo:** search, insights (5 types), demographics, heatmap, compare, trending, explainability, tap counts as weighted signals.
- **How it's built:** Next.js, a Claude agent with Qloo tools, Web Speech API, ARASAAC, OBF export.
- **Challenges:** hackathon endpoint coverage, privacy-first design.
- **What's next:** speech-therapist pilots and a Cboard integration (cboard#1267).
