import type { ServerAdapterModule } from "../types.js";
import { execute } from "./execute.js";
import { testEnvironment } from "./test.js";

export const zeroclawAdapter: ServerAdapterModule = {
  type: "zeroclaw",
  execute,
  testEnvironment,
  models: [],
  agentConfigurationDoc: `# ZeroClaw Agent Configuration

Adapter: zeroclaw

Core fields:
- url (string, required): Endpoint of the ZeroClaw performance execution runtime. Defaults to "http://zeroclaw:42617".
- timeoutMs (number, optional): Request timeout in milliseconds.
`,
};
