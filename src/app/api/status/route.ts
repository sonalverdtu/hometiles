import { connection } from "next/server";
import { getConfig } from "@/lib/config";

export async function GET() {
  await connection();
  const c = getConfig();
  return Response.json({ qlooMode: c.qlooMode, llmMode: c.llmMode, agentMode: c.agentMode, baseUrl: c.qlooBaseUrl, model: c.llmModel });
}
