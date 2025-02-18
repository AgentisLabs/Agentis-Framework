import { ITool } from '../tools/ITool';

export type AgentConfig = {
  id: string;
  name: string;
  lore: string;
  role: string;
  goals: string[];
  tools?: ITool[];
  model?: {
    provider: 'anthropic' | 'openai' | 'google';
    name: string;
    temperature?: number;
    maxTokens?: number;
  };
}; 