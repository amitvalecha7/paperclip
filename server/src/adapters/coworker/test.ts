import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "../types.js";
import { asString, parseObject } from "../utils.js";

function summarizeStatus(checks: AdapterEnvironmentCheck[]): AdapterEnvironmentTestResult["status"] {
  if (checks.some((check) => check.level === "error")) return "fail";
  if (checks.some((check) => check.level === "warn")) return "warn";
  return "pass";
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = parseObject(ctx.config);
  const urlValue = asString(config.url, "http://coworker:4111/protocol/action");

  if (!urlValue) {
    checks.push({
      code: "coworker_url_missing",
      level: "error",
      message: "Coworker adapter requires an endpoint URL.",
      hint: "Configure the adapter with a valid Coworker action endpoint.",
    });
  } else {
    try {
      const url = new URL(urlValue);
      checks.push({
        code: "coworker_url_valid",
        level: "info",
        message: `Configured endpoint: ${url.toString()}`,
      });
    } catch {
      checks.push({
        code: "coworker_url_invalid",
        level: "error",
        message: `Invalid URL: ${urlValue}`,
      });
    }
  }

  return {
    adapterType: ctx.adapterType,
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}
