export interface LlmProvider {
  generate(prompt: string, conversationHistory: string[]): Promise<string>;
}
