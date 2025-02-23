import { 
  Agent, 
  AgentRuntime, 
  WebSearchTool, 
  OpenRouterTool,
  AgentMessage 
} from '../core';
import { createInterface } from 'readline';

// Create our specialized agents
const researchAgent = new Agent(
  'research-1',
  'MarketResearcher',
  'I am a market research specialist focusing on gathering and analyzing market data',
  'Market Researcher',
  ['Gather market information', 'Analyze market trends'],
  [new WebSearchTool()]
);

const strategyAgent = new Agent(
  'strategy-1',
  'StrategyMaster',
  'I synthesize market research and create actionable insights',
  'Strategy Analyst',
  ['Synthesize research', 'Create trading strategies'],
  [new OpenRouterTool()]
);

async function main() {
  // Initialize runtime
  const runtime = new AgentRuntime();
  
  // Register our agents
  runtime.registerAgent(researchAgent);
  runtime.registerAgent(strategyAgent);
  
  // Start the runtime
  await runtime.start();

  // Create readline interface
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("\n🤖 Welcome to the Market Analysis Team!");
  console.log("Enter a market analysis request (or 'exit' to quit)");

  // Main interaction loop
  readline.question("\n🔍 What would you like to analyze? ", async (query) => {
    if (query.toLowerCase() === 'exit') {
      readline.close();
      return;
    }

    try {
      // First, get market research
      console.log("\n📊 Market Researcher gathering data...");
      const researchResponse = await researchAgent.receiveMessage({
        id: `msg-${Date.now()}`,
        sender_id: 'user',
        recipient_id: researchAgent.id,
        content: `Research the following market topic: ${query}`,
        timestamp: Date.now()
      });

      // Then, get strategy analysis
      console.log("\n🎯 Strategy Master analyzing findings...");
      const strategyResponse = await strategyAgent.receiveMessage({
        id: `msg-${Date.now()}`,
        sender_id: researchAgent.id,
        recipient_id: strategyAgent.id,
        content: `Based on this research: ${researchResponse.content}\nProvide strategic insights and recommendations.`,
        timestamp: Date.now()
      });

      console.log("\n📈 Analysis Results:");
      console.log("-------------------");
      console.log(strategyResponse.content);

    } catch (error) {
      console.error("Error during analysis:", error);
    }

    // Continue the loop
    main();
  });
}

// Add proper error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Run the team
console.log("Starting Market Analysis Team...");
main().catch(console.error); 