export type AgentEventType = 'thinking' | 'tool_call' | 'tool_result' | 'final_answer' | 'error';

export interface AgentEvent {
  type: AgentEventType;
  content?: string;
  toolName?: string;
  args?: Record<string, any>;
  result?: string;
  timestamp: number;
}
