import { LlmProvider } from './llm-provider.interface.js';

/**
 * Ollama-backed LLM provider.
 * Defaults to qwen2.5-coder:7b, published in November 2024 under the Apache 2.0 license.
 */
export class OllamaProvider implements LlmProvider {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL?.trim() || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL?.trim() || 'qwen2.5-coder:7b';
  }

  getModel(): string {
    return this.model;
  }

  async generate(prompt: string, conversationHistory: string[]): Promise<string> {
    const systemPrompt = `You are a reasoning agent that follows the ReAct pattern.

You have access to these tools:
- calculator: perform arithmetic (args: {expression: string})
- weather: get weather for a city (args: {city: string})
- search: search for technical information (args: {query: string})

INSTRUCTIONS:
1. To use a tool, respond with:
THOUGHT: <your reasoning>
ACTION: calculator({"expression":"2 + 2"})

2. After you see "Observation:" (the tool result), you MUST respond with FINAL_ANSWER. Do NOT call a tool again.
THOUGHT: <your reasoning>
FINAL_ANSWER: <your answer>

3. NEVER use ACTION and FINAL_ANSWER together. Choose ONE.

EXAMPLE OF A COMPLETE CONVERSATION:
User: Calculate 2 + 2
Assistant:
THOUGHT: I need to calculate 2 + 2
ACTION: calculator({"expression":"2 + 2"})
Observation: tool calculator returned 4
Assistant:
THOUGHT: The calculator returned 4, so the answer is 4
FINAL_ANSWER: 4`;

    // Build full conversation from history.
    // Even indices are model responses (prefixed "Assistant:"), odd indices are observations.
    const segments: string[] = [systemPrompt, ''];
    segments.push(`User: ${prompt}`);
    for (let i = 0; i < conversationHistory.length; i++) {
      if (i % 2 === 0) {
        segments.push(`Assistant:\n${conversationHistory[i]}`);
      } else {
        segments.push(conversationHistory[i]);
      }
    }
    segments.push('Assistant:');
    const fullPrompt = segments.join('\n');

    const url = `${this.baseUrl.replace(/\/$/, '')}/api/generate`;

    // Retry up to 3 times with exponential backoff for transient failures
    const maxRetries = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            prompt: fullPrompt,
            stream: false,
            options: {
              temperature: 0.1,
              num_predict: 1024
            }
          })
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Ollama responded with ${response.status}: ${text}`);
        }

        const data = (await response.json()) as { response?: string };
        return data.response?.trim() || 'FINAL_ANSWER: Sorry, I received an empty response.';
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
          console.warn(`OllamaProvider attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    const message = lastError instanceof Error ? lastError.message : String(lastError);
    return `FINAL_ANSWER: I could not reach the Ollama server at ${this.baseUrl}. Details: ${message}`;
  }
}
