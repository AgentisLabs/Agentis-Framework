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
    // Market Researcher with WebSearch
    await AgentFactory.createAgent({
      id: 'researcher-1',
      name: 'MarketResearcher',
      lore: 'I am a crypto market researcher specializing in deep research and fundamental analysis. I always use web search to find current information.',
      role: 'Market Researcher',
      goals: ['Conduct thorough market research', 'Analyze project fundamentals'],
      tools: [new WebSearchTool()]
    }),

    // Technical Analyst with both WebSearch and OpenRouter
    await AgentFactory.createAgent({
      id: 'analyst-1',
      name: 'TechnicalAnalyst',
      lore: 'I am a technical analyst focusing on market metrics and patterns. I always use web search to find current price data and technical indicators.',
      role: 'Technical Analyst',
      goals: ['Analyze market metrics', 'Identify technical patterns'],
      tools: [new WebSearchTool(), new OpenRouterTool()]
    }),

    // Strategy Master with Claude 3.7
    await AgentFactory.createAgent({
      id: 'strategy-1',
      name: 'StrategyMaster',
      lore: 'I am an elite strategy master powered by Claude 3.7. I synthesize research and technical analysis to provide actionable insights.',
      role: 'Strategy Coordinator',
      goals: ['Synthesize research findings', 'Generate strategic insights'],
      tools: [new AnthropicTool()]
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

  // Research phase with specific directives
  console.log("\n📚 Market Researcher investigating...");
  const researchResponse = await agents[0].receiveMessage({
    id: `msg-${Date.now()}`,
    sender_id: agents[2].id,
    recipient_id: agents[0].id,
    content: `Use web search to find current information about ${userTask}.
    DO NOT ACKNOWLEDGE - EXECUTE RESEARCH IMMEDIATELY.
    
    Provide SPECIFIC findings about:
    1. Project Overview & Technology (what it does, how it works)
    2. Team Background & Credibility (real names, experience)
    3. Tokenomics & Distribution (actual numbers)
    4. Recent Developments & News (real dates, events)
    5. Market Position & Competitors (real competitors, market share)
    
    Research Plan Context: ${planningResponse.content}
    
    Use your WebSearchTool to find CURRENT data. For any aspect where information cannot be verified, state "No verifiable information found for [specific aspect]"`,
    timestamp: Date.now()
  });
  console.log("\n🔍 Research Findings:");
  console.log(researchResponse.content);

  // Technical analysis phase with specific focus areas
  console.log("\n📊 Technical Analyst processing...");
  const technicalResponse = await agents[1].receiveMessage({
    id: `msg-${Date.now()}`,
    sender_id: agents[2].id,
    recipient_id: agents[1].id,
    content: `Use web search to find CURRENT market data for ${userTask}.
    DO NOT ACKNOWLEDGE - EXECUTE ANALYSIS IMMEDIATELY.
    
    Provide SPECIFIC analysis of:
    1. Current Price & Market Cap (use CoinGecko or similar)
    2. Volume Analysis & Trends (24h volume, volume trends)
    3. Key Support/Resistance Levels (with specific prices)
    4. Market Structure & Patterns (current patterns forming)
    5. Liquidity Analysis (depth, spreads, major exchanges)
    
    Research Context: ${researchResponse.content}
    
    Use your WebSearchTool to find CURRENT market data. For any metric that cannot be found, state "No data available for [specific metric]"`,
    timestamp: Date.now()
  });
  console.log("\n📈 Technical Analysis:");
  console.log(technicalResponse.content);

  // Final synthesis with concrete recommendations
  console.log("\n🧠 Strategy Master synthesizing final insights...");
  const finalResponse = await agents[2].receiveMessage({
    id: `msg-${Date.now()}`,
    sender_id: 'user-1',
    recipient_id: agents[2].id,
    content: `As an elite strategy master powered by Claude 3.7, synthesize a final analysis for ${userTask}.
    DO NOT ACKNOWLEDGE - PROVIDE ANALYSIS IMMEDIATELY.
    BE CONCISE BUT COMPLETE - ENSURE ALL SECTIONS ARE FULLY FINISHED.
    
    Structure your response as:

    KEY FINDINGS (3-4 bullet points):
    - Most important discoveries
    - Critical metrics
    - Major trends

    SWOT ANALYSIS (2-3 points each):
    Strengths: [Project advantages]
    Weaknesses: [Current limitations]
    Opportunities: [Potential catalysts]
    Threats: [Key risks]

    INVESTMENT THESIS:
    • Current Market Position
    • Growth Potential
    • Risk Assessment
    • Investment Timeline

    TRADING PLAN:
    • Entry Points: [Specific price levels]
    • Exit Targets: [Profit targets]
    • Stop Losses: [Risk management levels]
    • Position Sizing: [Recommended allocation]
    • Key Indicators to Monitor

    RISK MANAGEMENT:
    1. [Primary risk control measure]
    2. [Secondary risk control measure]
    3. [Emergency exit conditions]

    Research: ${researchResponse.content}
    Technical Analysis: ${technicalResponse.content}`,
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