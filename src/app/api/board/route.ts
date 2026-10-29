// Streams agent progress as NDJSON, then the finished board (FR-201, FR-209).

import { z } from "zod";
import { generateBoard } from "@/lib/agent/run";
import { ProfileSchema, readJson } from "@/lib/http";
import type { StreamEvent } from "@/lib/board/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  const body = await readJson(req, z.object({ profile: ProfileSchema }));
  if (!body.ok) return body.res;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
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
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
