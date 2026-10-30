// Board generation: the agent (Claude tool runner) or the scripted planner gathers Qloo evidence,
// then the deterministic engine composes the board and Claude (or templates) writes the words.

import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getConfig } from "../config";
import { Qloo } from "../qloo";
import { Tracer, type TraceEntry } from "../qloo/trace";
import { arasaacUrl } from "../pictograms";
import { claude, FALLBACK_BETA } from "../llm/claude";
import { writeTileText } from "../llm";
import { runGeminiAgent, type AgentTool } from "../llm/gemini";
import { assembleBoard, QUOTAS, rankCandidates, type Candidate, type TileText } from "../board/engine";
import { CORE, SAFETY } from "../board/vocab";
import type { Board, Localized, Profile } from "../board/types";
import {
  audienceProfile,
  expandPersonalTaste,
  findLocalBrands,
  findLocalPlaces,
  resolveLoves,
  sharedWithFamily,
  whatsRising,
  type AgentCtx,
} from "./toolbox";

export interface RunHooks {
  step: (text: string, tool?: string) => void;
  trace: (entry: TraceEntry) => void;
}

async function scripted(ctx: AgentCtx) {
  await Promise.all([expandPersonalTaste(ctx), findLocalBrands(ctx), findLocalPlaces(ctx), sharedWithFamily(ctx)]);
  await Promise.all([audienceProfile(ctx), whatsRising(ctx)]);
}

const AGENT_SYSTEM = `You are the research agent inside HomeTiles, which builds AAC communication boards for non-speaking people.
Your job: gather evidence from Qloo's taste graph so the board holds the person's real foods, places and favourite things.
Use the tools. Cover all of these before you finish: favourites (expand_personal_taste), local snacks/brands (find_local_brands),
places near home (find_local_places), things to share with each family member who has favourites (shared_with_family),
who-loves-what audience checks (audience_profile, after you have candidates), and what's rising (whats_rising).
Call independent tools in parallel. When done, reply with 2-3 short sentences for the parent explaining what you focused on and why.
Do not invent places or facts; the board is built only from tool results.`;

/** The research tools, described once and handed to whichever LLM provider runs the agent. */
function agentTools(ctx: AgentCtx): AgentTool[] {
  const tool = <S extends z.ZodObject>(name: string, description: string, schema: S, run: (input: z.infer<S>) => Promise<string>): AgentTool => ({
    name,
    description,
    schema,
    run: (input) => run(input as z.infer<S>),
  });
  return [
    tool(
      "expand_personal_taste",
      "Find shows, games, music and films the person is likely to love, from their favourites (Qloo insights).",
      z.object({ types: z.array(z.enum(["tv_show", "videogame", "artist", "movie"])).min(1) }),
      ({ types }) => expandPersonalTaste(ctx, types.map((t) => `urn:entity:${t}` as const)),
    ),
    tool("find_local_brands", "Find snacks, foods and brands that fit the person's taste and are popular where they live.", z.object({ take: z.number().int().min(4).max(20) }), ({ take }) =>
      findLocalBrands(ctx, take),
    ),
    tool(
      "find_local_places",
      "Find real places near home that fit the person's taste. Uses Qloo's heatmap to find taste hot-spots first.",
      z.object({ radius_m: z.number().int().min(500).max(8000), use_heatmap: z.boolean() }),
      ({ radius_m, use_heatmap }) => findLocalPlaces(ctx, radius_m, use_heatmap),
    ),
    tool(
      "shared_with_family",
      "Compare the person's taste with a family member's (by relation, e.g. 'grandfather') to find things they can enjoy together.",
      z.object({ relation: z.string() }),
      ({ relation }) => sharedWithFamily(ctx, relation),
    ),
    tool("audience_profile", "Check which age groups love the current candidates, to route tiles to the right conversation partner.", z.object({ max: z.number().int().min(4).max(12) }), ({ max }) =>
      audienceProfile(ctx, max),
    ),
    tool("whats_rising", "Find picks that fit the person's taste and are rising right now.", z.object({}), () => whatsRising(ctx)),
  ];
}

async function agentic(ctx: AgentCtx) {
  const cfg = getConfig();
  const tools = agentTools(ctx);
  const p = ctx.profile;
  const brief = {
    city: p.city,
    age_band: p.ageBand,
    is_child: p.isChild,
    languages: [p.primaryLang, p.secondaryLang].filter(Boolean),
    favourites: p.loves.map((l) => `${l.name} (${l.type.split(":")[2]})${l.qlooId ? "" : " [unresolved]"}`),
    family: p.family.map((f) => ({ relation: f.relation, has_favourites: f.loves.some((l) => l.qlooId) })),
  };
  const userPrompt = `Build the evidence for this person's board:
${JSON.stringify(brief)}`;
  ctx.emit(`Agent (${cfg.llmProvider === "gemini" ? "Gemini" : "Claude"}) is planning which Qloo tools to use…`, "agent");
  let summary = "";
  if (cfg.llmProvider === "gemini") {
    summary = await runGeminiAgent(AGENT_SYSTEM, userPrompt, tools);
  } else {
    const final = await claude().beta.messages.toolRunner({
      model: cfg.llmModel,
      max_tokens: 16000,
      max_iterations: 8,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: AGENT_SYSTEM,
      tools: tools.map((t) => betaZodTool({ name: t.name, description: t.description, inputSchema: t.schema, run: (input) => t.run(input) })),
      messages: [{ role: "user", content: userPrompt }],
    });
    summary = final.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join(" ");
  }
  if (summary.trim()) ctx.notes.unshift(summary.trim());
}

/** Make sure every section has evidence even if the agent skipped a tool. */
async function fillGaps(ctx: AgentCtx) {
  const gaps: Promise<unknown>[] = [];
  if (!ctx.ran.has("expand_personal_taste")) gaps.push(expandPersonalTaste(ctx));
  if (!ctx.ran.has("find_local_brands")) gaps.push(findLocalBrands(ctx));
  if (!ctx.ran.has("find_local_places")) gaps.push(findLocalPlaces(ctx));
  if (!ctx.ran.has("shared_with_family")) gaps.push(sharedWithFamily(ctx));
  await Promise.all(gaps);
  if (!ctx.ran.has("audience_profile")) await audienceProfile(ctx);
  if (!ctx.ran.has("whats_rising")) await whatsRising(ctx);
}

function shortlist(cands: Candidate[]): Candidate[] {
  const counts: Record<string, number> = {};
  // Keep extra favourites so the board engine can balance kinds (shows, games, music, films).
  return rankCandidates(cands).filter((c) => {
    const n = counts[c.category] ?? 0;
    if (n >= QUOTAS[c.category] * (c.category === "favourites" ? 2 : 1)) return false;
    counts[c.category] = n + 1;
    return true;
  });
}

async function tileText(profile: Profile, picks: Candidate[], hooks: RunHooks): Promise<Record<string, TileText> | undefined> {
  if (getConfig().llmMode !== "live" || !picks.length) return undefined;
  hooks.step("Writing tile words in both languages…", "labels");
  try {
    const { parsed, primary, secondary } = await writeTileText(
      profile,
      picks.map((c) => ({ id: c.entity.id, category: c.category, name: c.entity.name, type: c.entity.type.split(":")[2] })),
    );
    if (!parsed) return undefined;
    const out: Record<string, TileText> = {};
    for (const t of parsed.tiles) {
      const label = { en: primary === "en" ? t.label_primary : secondary === "en" ? t.label_secondary : t.label_primary } as Localized;
      const speak = { en: primary === "en" ? t.speak_primary : secondary === "en" ? t.speak_secondary : t.speak_primary } as Localized;
      label[primary] = t.label_primary;
      speak[primary] = t.speak_primary;
      label[secondary] = t.label_secondary;
      speak[secondary] = t.speak_secondary;
      out[t.id] = { label, speak };
    }
    return out;
  } catch (err) {
    hooks.step(`Labelling fell back to templates (${(err as Error).message.slice(0, 80)})`, "labels");
    return undefined;
  }
}

async function addPictograms(board: Board) {
  const words = [...CORE, ...SAFETY];
  const urls = await Promise.all(words.map((w) => arasaacUrl(w.arasaac)));
  words.forEach((w, i) => {
    const url = urls[i];
    const id = CORE.includes(w) ? `core-${w.key}` : `safety-${w.key}`;
    if (url && board.tiles[id]) board.tiles[id] = { ...board.tiles[id], image: { url, source: "arasaac" } };
  });
}

export async function generateBoard(profileIn: Profile, hooks: RunHooks): Promise<Board> {
  const cfg = getConfig();
  const profile: Profile = structuredClone(profileIn);
  const tracer = new Tracer(hooks.trace);
  const ctx: AgentCtx = {
    profile,
    qloo: new Qloo(tracer),
    emit: hooks.step,
    candidates: new Map(),
    demographics: new Map(),
    notes: [],
    ran: new Set(),
  };

  await resolveLoves(ctx);
  if (cfg.agentMode === "llm") {
    try {
      await agentic(ctx);
    } catch (err) {
      hooks.step(`Agent hit a problem (${(err as Error).message.slice(0, 80)}); finishing with the scripted planner.`, "agent");
    }
    await fillGaps(ctx);
  } else {
    await scripted(ctx);
  }

  hooks.step("Ranking and laying out the board…", "compose");
  const picks = shortlist([...ctx.candidates.values()]);
  const text = await tileText(profile, picks, hooks);
  const board = assembleBoard({
    id: `b-${Date.now().toString(36)}`,
    profile,
    candidates: picks,
    text,
    mode: { qloo: ctx.qloo.mode, llm: cfg.llmMode, agent: cfg.agentMode },
    trace: tracer.entries,
    heat: ctx.heat?.map((c) => ({ lat: c.lat, lon: c.lon, affinity: c.affinity })),
    notes: ctx.notes,
  });
  await addPictograms(board);
  hooks.step("Board ready!", "done");
  return board;
}

/** Fresh candidates for the weekly refresh, seeded by what actually got tapped (weighted by count). */
export async function refreshCandidates(profile: Profile, top: { id: string; name: string }[], hooks: RunHooks) {
  const tracer = new Tracer(hooks.trace);
  const ctx: AgentCtx = {
    profile: {
      ...profile,
      loves: [
        ...top.map((t) => ({ qlooId: t.id, name: t.name, type: "urn:entity:tv_show" as const })),
        ...profile.loves,
      ].slice(0, 8),
    },
    qloo: new Qloo(tracer),
    emit: hooks.step,
    candidates: new Map(),
    demographics: new Map(),
    notes: [],
    ran: new Set(),
  };
  await Promise.all([expandPersonalTaste(ctx, undefined, 8), findLocalBrands(ctx, 8)]);
  return { candidates: [...ctx.candidates.values()], trace: tracer.entries };
}
