import { AgentEvent } from './agent-event.js';
import { LlmProvider } from '../providers/llm-provider.interface.js';
import { Tool } from '../tools/tool.interface.js';
import { transition } from './state-machine.js';

export interface AgentLoopDependencies {
  provider: LlmProvider;
  tools: Tool[];
  maxIterations?: number;
}

function parseLlmResponse(text: string): {
  thought: string;
  action?: { toolName: string; args: Record<string, any> };
  finalAnswer?: string;
} {
  const thoughtMatch = text.match(/THOUGHT:\s*(.+?)(?=\nACTION:|\nFINAL_ANSWER:|$)/is);
  const thought = thoughtMatch ? thoughtMatch[1].trim() : '';

  const actionMatch = text.match(/ACTION:\s*(\w+)\s*\((\{[^)]*\})\)/is);
  const finalAnswerMatch = text.match(/FINAL_ANSWER:\s*(.+)/is);

  return {
    thought,
    action: actionMatch
      ? {
          toolName: actionMatch[1].trim(),
          args: parseArgs(actionMatch[2])
        }
      : undefined,
    finalAnswer: finalAnswerMatch ? finalAnswerMatch[1].trim() : undefined
  };
}

function parseArgs(raw: string): Record<string, any> {
// Normalize: add quotes around unquoted keys (common LLM output issue)
  // e.g. {expression: "15 * 7"} → {"expression": "15 * 7"}
  const normalized = raw.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
  try {
    return JSON.parse(normalized);
  } catch {
    return { raw };
  }
}

function now(): number {
  return Date.now();
}

export async function runAgentLoop(
  prompt: string,
  onEvent: (event: AgentEvent) => void,
  deps: AgentLoopDependencies
): Promise<void> {
  const { provider, tools, maxIterations = 10 } = deps;
  const toolMap = new Map(tools.map((t) => [t.name, t]));
  const history: string[] = [];

  let currentState = transition('IDLE', 'start');

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    currentState = transition(currentState, 'llm_response');

    let rawResponse: string;
    try {
      rawResponse = await provider.generate(prompt, history);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onEvent({ type: 'error', content: message, timestamp: now() });
      transition(currentState, 'error');
      return;
    }

    const parsed = parseLlmResponse(rawResponse);

    if (parsed.thought) {
      onEvent({ type: 'thinking', content: parsed.thought, timestamp: now() });
    }

    if (parsed.action) {
      currentState = transition(currentState, 'action');
      const { toolName, args } = parsed.action;

      onEvent({
        type: 'tool_call',
        toolName,
        args,
        timestamp: now()
      });

      const tool = toolMap.get(toolName);
      let result: string;

      try {
        if (!tool) {
          result = `Error: tool "${toolName}" not found`;
        } else {
          result = await tool.execute(args);
        }
      } catch (err) {
        result = err instanceof Error ? err.message : String(err);
      }

      onEvent({
        type: 'tool_result',
        toolName,
        result,
        timestamp: now()
      });

      // Store the model's raw response AND the observation for full context
      history.push(rawResponse);
      history.push(`Observation: tool ${toolName} returned ${result}`);
      currentState = transition(currentState, 'observation');
      continue;
    }

    if (parsed.finalAnswer !== undefined) {
      currentState = transition(currentState, 'final');
      onEvent({
        type: 'final_answer',
        content: parsed.finalAnswer,
        timestamp: now()
      });
      return;
    }

    // Fallback when the model did not follow the expected format
    onEvent({
      type: 'final_answer',
      content: rawResponse || 'No actionable response generated.',
      timestamp: now()
    });
    transition(currentState, 'final');
    return;
  }

  onEvent({
    type: 'error',
    content: 'Maximum number of ReAct iterations reached.',
    timestamp: now()
  });
  transition(currentState, 'error');
}
