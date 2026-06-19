import { LlmProvider } from './llm-provider.interface.js';

function extractMathExpression(prompt: string): string | null {
  // Look for patterns like "Calculate 15 * 7 + 3" or "2+2"
  const afterCalculate = prompt.match(/(?:calculate|compute|what is|what's)\s+([0-9+\-*/().\s]+)/i);
  if (afterCalculate) {
    return afterCalculate[1].trim();
  }

  const standalone = prompt.match(/([0-9+\-*/().\s]{3,})/);
  if (standalone) {
    return standalone[1].trim();
  }
  return null;
}

function extractCity(prompt: string): string | null {
  const match = prompt.match(/(?:weather in|weather for|weather of)\s+([a-z\s]+)/i);
  return match ? match[1].trim() : null;
}

function extractSearchQuery(prompt: string): string | null {
  const match = prompt.match(/(?:search for|search|find|look up)\s+(?:information about\s+)?(.+)/i);
  return match ? match[1].trim().replace(/[?.,!]$/, '') : null;
}

function hasToolResult(history: string[]): boolean {
  return history.some((entry) => entry.includes('tool_result') || entry.includes('Observation:'));
}

/**
 * Deterministic LLM provider used for fast, dependency-free ReAct demos.
 */
export class SimulatedProvider implements LlmProvider {
  async generate(prompt: string, conversationHistory: string[]): Promise<string> {
    const lower = prompt.toLowerCase();

    if (hasToolResult(conversationHistory)) {
      return `THOUGHT: I now have the observation from the tool.\nFINAL_ANSWER: Based on the tool result, the answer to "${prompt}" is ready.`;
    }

    if (lower.includes('calculate') || extractMathExpression(prompt)) {
      const expression = extractMathExpression(prompt) ?? '0';
      return `THOUGHT: I need to calculate this.\nACTION: calculator({"expression":"${expression}"})`;
    }

    if (lower.includes('weather')) {
      const city = extractCity(prompt) ?? 'London';
      return `THOUGHT: Let me check the weather.\nACTION: weather({"city":"${city}"})`;
    }

    if (lower.includes('search') || lower.includes('find')) {
      const query = extractSearchQuery(prompt) ?? prompt;
      return `THOUGHT: Let me search.\nACTION: search({"query":"${query}"})`;
    }

    return `THOUGHT: This is a direct question that does not require a tool.\nFINAL_ANSWER: ${prompt}`;
  }
}
