import { AgentConfig } from '../types/agent-config';
import { WebSearchTool } from '../tools/WebSearchTool';
import { OpenRouterTool } from '../tools/OpenRouterTool';

// Define default tools that will be available to all agents
const defaultTools = [
  new WebSearchTool(),
  new OpenRouterTool()
];

export const agentConfigs: Record<string, AgentConfig> = {
  'crypto-analyst': {
    id: 'crypto-analyst-1',
    name: 'CryptoAnalyst',
    lore: 'I am a cryptocurrency market analyst specializing in technical and fundamental analysis.',
    role: 'Market Analyst',
    goals: [
      'Analyze crypto market trends',
      'Identify trading opportunities',
      'Assess market risks'
    ],
    tools: defaultTools
  },
  'market-researcher': {
    id: 'market-researcher-1',
    name: 'MarketScout',
    lore: 'I am a crypto market researcher specializing in discovering promising cryptocurrency projects.',
    role: 'Market Researcher',
    goals: [
      'Discover promising crypto projects',
      'Analyze project fundamentals',
      'Evaluate market potential'
    ],
    tools: defaultTools
  }
};

// Helper function to get agent config
export function getAgentConfig(type: string): AgentConfig {
  const config = agentConfigs[type];
  if (!config) {
    throw new Error(`Unknown agent type: ${type}`);
  }
  return config;
} 