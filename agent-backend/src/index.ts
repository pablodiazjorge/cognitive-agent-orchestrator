import 'dotenv/config';
import { createServer } from './server.js';
import { LlmProvider } from './providers/llm-provider.interface.js';
import { SimulatedProvider } from './providers/simulated-provider.js';
import { OllamaProvider } from './providers/ollama-provider.js';

function createLlmProvider(): LlmProvider {
  const provider = process.env.LLM_PROVIDER?.trim().toLowerCase() || 'simulated';

  if (provider === 'ollama') {
    return new OllamaProvider();
  }

  return new SimulatedProvider();
}

const provider = createLlmProvider();
const providerName = process.env.LLM_PROVIDER?.trim().toLowerCase() || 'simulated';
const model = provider instanceof OllamaProvider ? provider.getModel() : 'deterministic-simulated';

const app = createServer(provider, providerName, model);
const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Agent backend listening on port ${port}`);
  console.log(`LLM provider: ${providerName}, model: ${model}`);
});
