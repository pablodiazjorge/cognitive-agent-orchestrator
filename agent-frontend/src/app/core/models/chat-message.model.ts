export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}
