import { AgentFactory } from '../agents/AgentFactory';
import { AgentMessage } from '../agents/AgentMessage';
import { AgentRuntime } from '../runtime/AgentRuntime';
import { createInterface } from 'readline';
import { OpenRouterTool } from '../tools/OpenRouterTool';
import { WebSearchTool } from '../tools/WebSearchTool';
import { AnthropicTool } from '../tools/AnthropicTool';
import { getTeam } from '../config/framework-config';
import { IAgent } from '../agents/IAgent';

console.log('Environment check:', {
  hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
  url: process.env.NEXT_PUBLIC_URL
});

// Create readline interface for terminal input
const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promise wrapper for readline question
const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => readline.question(query, resolve));
};

async function main() {
  const runtime = new AgentRuntime();
  
  // Create our specialized agents directly instead of using configs
  const agents: IAgent[] = [
    // Market Researcher with WebSearch and OpenRouter
    await AgentFactory.createAgent({
      id: 'researcher-1',
      name: 'MarketResearcher',
      lore: 'I am an elite crypto market researcher specializing in deep research and fundamental analysis. I focus on finding verified, current information from multiple sources, always cross-referencing data. I prioritize official documentation, reputable news sources, and on-chain data. I clearly indicate when information cannot be verified.',
      role: 'Market Researcher',
      goals: [
        'Conduct thorough market research with multiple sources',
        'Verify all claims with links to sources',
        'Analyze project fundamentals with concrete data',
        'Track social metrics and community engagement'
      ],
      tools: [new WebSearchTool(), new OpenRouterTool()]
    }),

    // Technical Analyst with enhanced capabilities
    await AgentFactory.createAgent({
      id: 'analyst-1',
      name: 'TechnicalAnalyst',
      lore: 'I am an advanced technical analyst focusing on comprehensive market metrics and patterns. I combine on-chain analysis, technical indicators, and market microstructure analysis. I provide specific numerical data and time-stamped observations.',
      role: 'Technical Analyst',
      goals: [
        'Analyze detailed market metrics with specific numbers',
        'Provide on-chain analysis of token movements',
        'Calculate key technical indicators with precise values',
        'Monitor liquidity and market microstructure'
      ],
      tools: [new WebSearchTool(), new OpenRouterTool(), new AnthropicTool()]
    }),

    // Strategy Master with enhanced synthesis capabilities
    await AgentFactory.createAgent({
      id: 'strategy-1',
      name: 'StrategyMaster',
      lore: 'I am an elite strategy master powered by Claude 3.7. I synthesize research and technical analysis to provide actionable insights with specific recommendations and risk management strategies.',
      role: 'Strategy Coordinator',
      goals: [
        'Synthesize research findings into actionable insights',
        'Generate specific price targets and entry/exit points',
        'Develop detailed risk management strategies',
        'Provide clear investment timeframes and milestones'
      ],
      tools: [new AnthropicTool(), new WebSearchTool()]
    })
  ];
  
  // Register all agents
  agents.forEach(agent => runtime.registerAgent(agent));
  await runtime.start();

  console.log("\n🤖 Enhanced Crypto Research Team Ready!");
  console.log("Team Members:");
  console.log("1. Market Researcher (Deep Research with Web Search)");
  console.log("2. Technical Analyst (Market Analysis with Live Data)");
  console.log("3. Strategy Master (Claude 3.7 Enhanced Synthesis)\n");

  // Get user input for the research task
  const userTask = await askQuestion("Enter your research task: ");

  // First, let the goal planner create a structured research plan
  console.log("\n🎯 Strategy Master creating research plan...");
  const planningResponse = await agents[2].receiveMessage({
    id: `msg-${Date.now()}`,
    sender_id: 'user-1',
    recipient_id: agents[2].id,
    content: `Create a focused research plan for: ${userTask}. 
    DO NOT ACKNOWLEDGE - CREATE THE PLAN IMMEDIATELY.
    
    Structure your response as:
    
    RESEARCH TASKS:
    1. [Specific task for Market Researcher]
    2. [Specific task for Market Researcher]
    3. [Specific task for Market Researcher]
    
    TECHNICAL ANALYSIS TASKS:
    1. [Specific task for Technical Analyst]
    2. [Specific task for Technical Analyst]
    3. [Specific task for Technical Analyst]`,
    timestamp: Date.now()
  });
  
  console.log("\n📋 Research Plan:");
  console.log("-------------------");
  console.log(planningResponse.content);
  console.log("-------------------\n");

  // Modify the research phase to explicitly require web searches
  console.log("\n📚 Market Researcher investigating...");
  const researchResponse = await agents[0].receiveMessage({
    id: `msg-${Date.now()}`,
    sender_id: agents[2].id,
    recipient_id: agents[0].id,
    content: `Research task for ${userTask}.

    IMPORTANT INSTRUCTIONS:
    1. You MUST use your web search tool for EACH section
    2. Only include information you find through actual searches
    3. Format each finding as:
       [SEARCH RESULT]
       Query: "your search query"
       Source: actual_url
       Finding: your finding
    4. If a search returns no results, state "No results found for: [query]"
    5. DO NOT make up or infer information not found in searches
    
    Required Research Sections:
    1. Latest News & Updates
       - Search for recent news (last 30 days)
       - Search for official announcements
    
    2. Project Verification
       - Search for official website
       - Search for GitHub repositories
       - Search for official documentation
    
    3. Market Data
       - Search for current market cap
       - Search for trading volume
       - Search for exchange listings
    
    4. Team & Development
       - Search for team members
       - Search for recent development updates
       - Search for partnerships
    
    REMEMBER: Only include information you actually find through web searches. Do not hallucinate or infer data.`,
    timestamp: Date.now()
  });
  console.log("\n🔍 Research Findings:");
  console.log(researchResponse.content);

  // Modify technical analysis to require data sources
  console.log("\n📊 Technical Analyst processing...");
  const technicalResponse = await agents[1].receiveMessage({
    id: `msg-${Date.now()}`,
    sender_id: agents[2].id,
    recipient_id: agents[1].id,
    content: `Analyze ${userTask}.

    IMPORTANT INSTRUCTIONS:
    1. Use web search to find current market data
    2. Only report metrics you can actually verify
    3. Format each metric as:
       [MARKET DATA]
       Source: actual_url
       Metric: metric_name
       Value: current_value
       Time: timestamp
    4. If data cannot be found, state "Unable to verify: [metric]"
    
    Required Analysis:
    1. Current Market Metrics
       - Search for current price
       - Search for 24h volume
       - Search for market cap
    
    2. On-Chain Data
       - Search for holder statistics
       - Search for transaction volume
       - Search for contract interactions
    
    3. Market Activity
       - Search for exchange listings
       - Search for trading pairs
       - Search for liquidity data
    
    REMEMBER: Only include data you can verify through searches. Do not make up numbers.`,
    timestamp: Date.now()
  });
  console.log("\n📈 Technical Analysis:");
  console.log(technicalResponse.content);

  // Modify the strategy master to only work with verified data
  console.log("\n🧠 Strategy Master synthesizing final insights...");
  const finalResponse = await agents[2].receiveMessage({
    id: `msg-${Date.now()}`,
    sender_id: 'user-1',
    recipient_id: agents[2].id,
    content: `Synthesize verified findings for ${userTask}.

    IMPORTANT:
    1. Only use information that was verified in the research and technical analysis
    2. Clearly mark any gaps in data
    3. Do not make assumptions about missing information
    
    Structure your response as:

    VERIFIED FINDINGS:
    - List only facts that were confirmed through research
    - Include source links for each major finding
    
    DATA GAPS:
    - List important missing information
    - Recommend additional research needed
    
    CONFIDENCE ASSESSMENT:
    - High confidence findings (multiple sources)
    - Medium confidence findings (single source)
    - Low confidence/Unverified claims
    
    RECOMMENDATIONS:
    - Based only on verified data
    - Clear marking of assumptions
    - Risk factors from incomplete data

    Research Data: ${researchResponse.content}
    Technical Data: ${technicalResponse.content}`,
    timestamp: Date.now()
  });
  console.log("\n🔮 Final Analysis:");
  console.log("-------------------");
  console.log(finalResponse.content);
  console.log("-------------------\n");

  // Close readline interface
  readline.close();
}

// Run the interactive session
main().catch(console.error); 