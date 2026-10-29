// Server-side configuration. Never import this from client components.

type Mode = "live" | "mock";

function pickMode(setting: string | undefined, hasKey: boolean): Mode {
  const s = (setting ?? "auto").toLowerCase();
  if (s === "mock") return "mock";
  if (s === "live") return hasKey ? "live" : "mock";
  return hasKey ? "live" : "mock";
}

export function getConfig() {
  const qlooKey = process.env.QLOO_API_KEY?.trim() ?? "";
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  const qlooMode = pickMode(process.env.QLOO_MODE, qlooKey.length > 0);
  const llmMode = pickMode(process.env.LLM_MODE, anthropicKey.length > 0);
  const agentSetting = (process.env.AGENT_MODE ?? "auto").toLowerCase();
  const agentMode: "llm" | "scripted" =
    agentSetting === "scripted" ? "scripted" : agentSetting === "llm" && llmMode === "live" ? "llm" : llmMode === "live" ? "llm" : "scripted";

  return {
    qlooKey,
    qlooBaseUrl: (process.env.QLOO_BASE_URL ?? "https://hackathon.api.qloo.com").replace(/\/+$/, ""),
    qlooMode,
    llmMode,
    agentMode,
    llmModel: process.env.LLM_MODEL ?? "claude-opus-5-5",
    pictograms: (process.env.PICTOGRAMS ?? "on").toLowerCase() !== "off",
  };
}

export type AppConfig = ReturnType<typeof getConfig>;
