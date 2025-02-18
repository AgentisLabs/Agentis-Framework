export type AgentConfig = {
  id: string;
  name: string;
  lore: string;
  role: string;
  goals: string[];
  tools?: any[];
  model?: {
    provider: 'anthropic' | 'openai' | 'google',
    name: string,
    temperature?: number,
    maxTokens?: number
  };
  // Remove crypto-specific config, let users add their own in JSON
}; 