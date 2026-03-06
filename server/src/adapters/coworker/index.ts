import type { ServerAdapterModule } from "../types.js";
import { execute } from "./execute.js";
import { testEnvironment } from "./test.js";

export const coworkerAdapter: ServerAdapterModule = {
  type: "coworker",
  execute,
  testEnvironment,
  models: [],
  agentConfigurationDoc: `# Coworker Agent Configuration

Adapter: coworker

Core fields:
- url (string, required): Endpoint of the coworker specialist execution runtime. Defaults to "http://coworker:4111/protocol/action".
- timeoutMs (number, optional): Request timeout in milliseconds.
`,
};
