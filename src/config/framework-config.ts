import { AgentConfig } from '../types/agent-config';
import { ITool } from '../tools/ITool';
import { WebSearchTool } from '../tools/WebSearchTool';
import { OpenRouterTool } from '../tools/OpenRouterTool';

// Tool configurations
export const tools = {
  webSearch: () => new WebSearchTool(),
  openRouter: () => new OpenRouterTool()
} as const;

// Define tool combinations for different agent types
export const toolSets = {
  researcher: [tools.webSearch(), tools.openRouter()],
  analyst: [tools.webSearch(), tools.openRouter()],
  planner: [tools.openRouter()]
} as const;

// Agent configurations
export const agents: Record<string, AgentConfig> = {
  cryptoAnalyst: {
    id: 'crypto-analyst-1',
    name: 'CryptoAnalyst',
    lore: 'I am a cryptocurrency market analyst specializing in technical and fundamental analysis.',
    role: 'Market Analyst',
    goals: [
      'Analyze crypto market trends',
      'Identify trading opportunities',
      'Assess market risks'
    ],
    tools: [...toolSets.analyst]  // Spread operator to create new array
  },
  
  marketResearcher: {
    id: 'market-researcher-1',
    name: 'MarketScout',
    lore: 'I am a crypto market researcher specializing in discovering promising cryptocurrency projects.',
    role: 'Market Researcher',
    goals: [
      'Discover promising crypto projects',
      'Analyze project fundamentals',
      'Evaluate market potential'
    ],
    tools: [...toolSets.researcher]  // Spread operator to create new array
  },
  
  goalPlanner: {
    id: 'goal-planner-1',
    name: 'GoalPlanner',
    lore: 'I am a strategic goal planner that analyzes requests and determines optimal execution paths.',
    role: 'Planning Strategist',
    goals: [
      'Analyze user requests',
      'Determine execution strategy',
      'Optimize agent collaboration'
    ],
    tools: [...toolSets.planner]  // Spread operator to create new array
  }
};

// Team configurations for different scenarios
export const teams: Record<string, AgentConfig[]> = {
  cryptoResearch: [
    { ...agents.marketResearcher },
    { ...agents.cryptoAnalyst },
    { ...agents.goalPlanner }
  ],
  marketAnalysis: [
    { ...agents.cryptoAnalyst },
    { ...agents.goalPlanner }
  ]
};

// Helper function to get a team configuration
export function getTeam(teamName: keyof typeof teams): AgentConfig[] {
  return teams[teamName].map(config => ({...config}));  // Create new instances
}

// Helper function to get a single agent configuration
export function getAgent(agentName: keyof typeof agents): AgentConfig {
  return {...agents[agentName]};  // Create new instance
} 