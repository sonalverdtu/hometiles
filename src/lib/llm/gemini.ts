// Gemini provider (server only): labels, the "Without Qloo" baseline and a function-calling agent loop.

import { GoogleGenAI, type Content, type FunctionDeclaration, type Part } from "@google/genai";
import { z } from "zod";
import { getConfig } from "../config";
import type { Profile } from "../board/types";
import { BaselineSchema, LANG_NAME, TileTextSchema, type TileTextInput } from "./shared";

let client: GoogleGenAI | null = null;
function gemini(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: getConfig().geminiKey });
  return client;
}

async function json<T>(schema: z.ZodType<T>, system: string, prompt: string): Promise<T> {
  const res = await gemini().models.generateContent({
    model: getConfig().geminiModel,
    contents: prompt,
    config: { systemInstruction: system, responseMimeType: "application/json", responseJsonSchema: z.toJSONSchema(schema) },
  });
  return schema.parse(JSON.parse(res.text ?? "{}"));
}

export async function writeTileTextGemini(profile: Profile, items: TileTextInput[], system: string) {
  const primary = profile.primaryLang;
  const secondary = profile.secondaryLang ?? "en";
  const parsed = await json(
    TileTextSchema,
    system,
    `Primary language: ${LANG_NAME[primary]}. Secondary language: ${LANG_NAME[secondary]}. The person is ${profile.isChild ? "a child" : "an adult"}.\n` +
      `Return one entry per tile id.\nTiles:\n${JSON.stringify(items)}`,
  );
  return { parsed, primary, secondary };
}

export async function baselineGemini(profile: Profile, prompt: string) {
  return (await json(BaselineSchema, "You suggest AAC board vocabulary.", prompt)).tiles;
}

export interface AgentTool {
  name: string;
  description: string;
  schema: z.ZodObject;
  run: (input: unknown) => Promise<string>;
}

/** Manual function-calling loop: Gemini picks Qloo tools; we run them and feed results back. */
export async function runGeminiAgent(system: string, userPrompt: string, tools: AgentTool[], maxTurns = 8): Promise<string> {
  const declarations: FunctionDeclaration[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    parametersJsonSchema: z.toJSONSchema(t.schema),
  }));
  const contents: Content[] = [{ role: "user", parts: [{ text: userPrompt }] }];
  let summary = "";
  for (let turn = 0; turn < maxTurns; turn++) {
    const res = await gemini().models.generateContent({
      model: getConfig().geminiModel,
      contents,
      config: { systemInstruction: system, tools: [{ functionDeclarations: declarations }] },
    });
    const calls = res.functionCalls ?? [];
    const modelContent = res.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);
    if (!calls.length) {
      summary = res.text ?? "";
      break;
    }
    // Independent tools run in parallel; every result goes back in one turn.
    const parts: Part[] = await Promise.all(
      calls.map(async (call) => {
        const tool = tools.find((t) => t.name === call.name);
        let output: string;
        if (!tool) output = `Unknown tool ${call.name}`;
        else {
          const parsed = tool.schema.safeParse(call.args ?? {});
          output = parsed.success ? await tool.run(parsed.data).catch((e: Error) => `Tool failed: ${e.message}`) : `Invalid arguments: ${parsed.error.message}`;
        }
        return { functionResponse: { id: call.id, name: call.name, response: { output } } };
      }),
    );
    contents.push({ role: "user", parts });
  }
  return summary.trim();
}
