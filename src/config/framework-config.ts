import { AgentConfig } from '../types/agent-config';
import { ITool } from '../tools/ITool';
import { WebSearchTool } from '../tools/WebSearchTool';
import { OpenRouterTool } from '../tools/OpenRouterTool';
import { AnthropicTool } from '../tools/AnthropicTool';

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

// Model configurations
export const models = {
  default: {
    provider: 'anthropic',
    name: 'anthropic/claude-3.7-sonnet',
    temperature: 0.7,
    maxTokens: 4096
  },
  researcher: {
    provider: 'anthropic',
    name: 'anthropic/claude-3.7-sonnet',
    temperature: 0.7,
    maxTokens: 4096
  },
  analyst: {
    provider: 'anthropic',
    name: 'anthropic/claude-3.7-sonnet',
    temperature: 0.7,
    maxTokens: 4096
  },
  planner: {
    provider: 'anthropic',
    name: 'anthropic/claude-3.7-sonnet',
    temperature: 0.3,  // Lower temperature for more focused planning
    maxTokens: 4096
  }
} as const;

// Agent configurations
export const agents: Record<string, AgentConfig> = {
  cryptoAnalyst: {
    id: 'crypto-analyst-1',
    name: 'CryptoAnalyst',
    lore: `I am an elite cryptocurrency market analyst with over a decade of experience in both traditional finance and crypto markets. 
    I specialize in technical analysis, market psychology, and identifying macro trends. My analysis combines multiple timeframes, 
    from high-frequency trading patterns to long-term market cycles. I have a deep understanding of market structure, 
    orderflow analysis, and how institutional players influence the market. I pay special attention to derivatives markets, 
    funding rates, and on-chain metrics to form comprehensive market views.`,
    role: 'Market Analyst',
    goals: [
      'Analyze crypto market trends using multiple timeframes',
      'Identify high-probability trading opportunities',
      'Assess market risks and sentiment',
      'Monitor institutional activity and whale movements',
      'Track derivatives market dynamics'
    ],
    tools: [...toolSets.analyst],
    model: models.analyst
  },
  
  marketResearcher: {
    id: 'market-researcher-1',
    name: 'MarketScout',
    lore: `I am a crypto market researcher with extensive experience in blockchain technology and tokenomics. 
    I specialize in discovering promising cryptocurrency projects before they gain mainstream attention. 
    My analysis covers technical architecture, token distribution models, team background checks, 
    partnership verification, and community engagement metrics. I have a strong background in DeFi protocols, 
    Layer 1/2 solutions, and emerging crypto sectors like GameFi and RWA. I maintain relationships with 
    key industry players and monitor VC investment patterns.`,
    role: 'Market Researcher',
    goals: [
      'Discover emerging crypto projects with strong fundamentals',
      'Analyze tokenomics and economic models',
      'Evaluate team credentials and project roadmaps',
      'Monitor VC investments and industry partnerships',
      'Track protocol metrics and user adoption'
    ],
    tools: [...toolSets.researcher],
    model: models.researcher
  },
  
  goalPlanner: {
    id: 'goal-planner-1',
    name: 'StrategyMaster',
    lore: `I am an advanced strategic coordinator specializing in crypto market intelligence synthesis. 
    My role is to analyze complex market situations and coordinate our team's expertise for optimal insights. 
    I understand the intricate relationships between fundamental research and technical analysis, 
    helping bridge these perspectives for comprehensive market understanding. I excel at identifying 
    which aspects of research require deeper technical analysis and can prioritize critical market factors 
    that demand immediate attention.`,
    role: 'Planning Strategist',
    goals: [
      'Synthesize research and technical analysis insights',
      'Identify critical market factors requiring focus',
      'Coordinate team expertise for comprehensive analysis',
      'Ensure analysis covers all relevant market aspects',
      'Prioritize time-sensitive market opportunities'
    ],
    tools: [...toolSets.planner],
    model: models.planner
  },
  
  seniorAnalyst: {
    id: 'senior-analyst-1',
    name: 'SeniorAnalyst',
    lore: 'I am an elite market analyst powered by Claude 3.7, specializing in deep market analysis and complex pattern recognition',
    role: 'Senior Market Analyst',
    goals: [
      'Provide advanced market analysis',
      'Identify complex market patterns',
      'Generate high-confidence insights'
    ],
    tools: [new AnthropicTool()],
    model: {
      provider: 'anthropic',
      name: 'claude-3-7-sonnet-20250219',
      temperature: 0.7,
      maxTokens: 4096
    }
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