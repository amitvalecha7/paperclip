import type { AdapterExecutionContext, AdapterExecutionResult } from "../types.js";
import { asString, asNumber } from "../utils.js";

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const { config, runId, agent, context } = ctx;
  const url = asString(config.url, "http://coworker:4111/protocol/action");
  if (!url) throw new Error("Coworker adapter missing url");

  const timeoutMs = asNumber(config.timeoutMs, 0);
  const body = { agentId: agent.id, runId, context, action: "execute_task" };

  const controller = new AbortController();
  const timer = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      ...(timer ? { signal: controller.signal } : {}),
    });

    if (!res.ok) {
      throw new Error(`Coworker invoke failed with status ${res.status}`);
    }

    return {
      exitCode: 0,
      signal: null,
      timedOut: false,
      summary: `Coworker agent ${agent.name} triggered`,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
