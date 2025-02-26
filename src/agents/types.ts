export type AgentConfig = {
  id: string;
  name: string;
  lore: string;
  role: string;
  goals: string[];
  tools?: any[];
  model?: {
    provider: 'anthropic' | 'openai' | 'openrouter' | 'google',
    name: string,
    temperature?: number,
    maxTokens?: number,
    apiKey?: string
  };
  // Additional custom settings can be added by users
}; 