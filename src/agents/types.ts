export type ReasoningType = 'standard' | 'react';

export interface ReasoningConfig {
  type: ReasoningType;
  maxIterations?: number;
  verbose?: boolean;
  systemPrompt?: string;
}

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
  reasoning?: ReasoningConfig;
  // Additional custom settings can be added by users
}; 