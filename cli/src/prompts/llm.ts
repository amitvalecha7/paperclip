import * as p from "@clack/prompts";
import type { LlmConfig } from "../config/schema.js";

export async function promptLlm(): Promise<LlmConfig | undefined> {
  const configureLlm = await p.confirm({
    message: "Configure an LLM provider now?",
    initialValue: false,
  });

  if (p.isCancel(configureLlm)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  if (!configureLlm) return undefined;

  const provider = await p.select({
    message: "LLM provider",
    options: [
      { value: "claude" as const, label: "Claude (Anthropic)" },
      { value: "openai" as const, label: "OpenAI" },
      { value: "ollama" as const, label: "Ollama (Local)" },
      { value: "openrouter" as const, label: "OpenRouter" },
    ],
  });

  if (p.isCancel(provider)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  let apiKey: string | undefined;
  if (provider !== "ollama") {
    const key = await p.password({
      message: `${provider === "claude" ? "Anthropic" : provider === "openrouter" ? "OpenRouter" : "OpenAI"} API key`,
      validate: (val) => {
        if (!val) return "API key is required";
      },
    });

    if (p.isCancel(key)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    apiKey = key;
  }

  let baseUrl: string | undefined;
  if (provider === "ollama" || provider === "openrouter") {
    const url = await p.text({
      message: `${provider === "ollama" ? "Ollama" : "OpenRouter"} Base URL`,
      placeholder: provider === "ollama" ? "http://localhost:11434" : "https://openrouter.ai/api/v1",
      validate: (val) => {
        if (!val && provider === "ollama") return "Base URL is required for Ollama";
      },
    });

    if (p.isCancel(url)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    baseUrl = url || undefined;
  }

  return { provider, apiKey, baseUrl };
}
