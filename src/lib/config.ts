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
  const geminiKey = (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "").trim();
  const providerSetting = (process.env.LLM_PROVIDER ?? "auto").toLowerCase();
  const llmProvider: "anthropic" | "gemini" | null =
    providerSetting === "gemini" ? (geminiKey ? "gemini" : null)
    : providerSetting === "anthropic" ? (anthropicKey ? "anthropic" : null)
    : anthropicKey ? "anthropic" : geminiKey ? "gemini" : null;
  const qlooMode = pickMode(process.env.QLOO_MODE, qlooKey.length > 0);
  const llmMode = pickMode(process.env.LLM_MODE, llmProvider !== null);
  const agentSetting = (process.env.AGENT_MODE ?? "auto").toLowerCase();
  const agentMode: "llm" | "scripted" =
    agentSetting === "scripted" ? "scripted" : agentSetting === "llm" && llmMode === "live" ? "llm" : llmMode === "live" ? "llm" : "scripted";

  return {
    qlooKey,
    qlooBaseUrl: (process.env.QLOO_BASE_URL ?? "https://hackathon.api.qloo.com").replace(/\/+$/, ""),
    qlooMode,
    llmMode,
    agentMode,
    llmProvider,
    geminiKey,
    geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
    llmModel: process.env.LLM_MODEL ?? "claude-opus-5-5",
    pictograms: (process.env.PICTOGRAMS ?? "on").toLowerCase() !== "off",
    // The hackathon dataset's trend history ends around Sep 2025, so live mode reads this window, not "now".
    trendWindow: [process.env.QLOO_TREND_START ?? "2025-06-01", process.env.QLOO_TREND_END ?? "2025-09-30"] as [string, string],
  };
}

export type AppConfig = ReturnType<typeof getConfig>;
