// Streams agent progress as NDJSON, then the finished board (FR-201, FR-209).

import { z } from "zod";
import { generateBoard } from "@/lib/agent/run";
import { ProfileSchema, readJson } from "@/lib/http";
import type { StreamEvent } from "@/lib/board/types";

// A board usually takes about a minute; the rest is headroom for a slow Qloo or LLM (Vercel's plan maximum).
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await readJson(req, z.object({ profile: ProfileSchema }), { bucket: "board", limit: 4 });
  if (!body.ok) return body.res;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      // Some steps (the AI writing tile words) run 20s or more without news. A quiet stream can be cut by a
      // proxy or a phone network ("network error"), so send a tiny line every few seconds.
      const ping = setInterval(() => send({ type: "ping" }), 5000);
      try {
        const board = await generateBoard(body.data.profile, {
          step: (text, tool) => send({ type: "step", text, tool }),
          trace: (entry) => send({ type: "trace", entry }),
        });
        send({ type: "board", board });
      } catch (err) {
        console.error("board generation failed", err);
        send({ type: "error", message: "Board generation failed. Please try again." });
      } finally {
        clearInterval(ping);
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
