// examples/quick-start.ts
import { Agent, AgentRuntime, WebSearchTool, OpenRouterTool, AnthropicTool } from 'agentis';
import {
  EnhancedToolOrchestrator,
  GraphBuilder,
  ExecutionMode
} from 'agentis/tools';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  // Create an agent with tools
  const agent = new Agent(
    'market-analyst-1',
    'MarketAnalyst',
    'I am a crypto market analyst specialized in trend analysis',
    'Market Analyst',
    ['Analyze market trends', 'Provide trading insights'],
    [new WebSearchTool(), new AnthropicTool()]
  );

  // Initialize runtime
  const runtime = new AgentRuntime();
  runtime.registerAgent(agent);
  await runtime.start();

  // Get the tool orchestrator from the agent
  const toolOrchestrator = agent.getToolOrchestrator();

  // Example usage of the tool orchestration system
  console.log("Demonstrating tool orchestration...");

  // Build an execution graph
  const analysisGraph = new GraphBuilder()
    // First get current price and trend data in parallel
    .addTool('btc-price', 'WebSearchTool', 'Bitcoin current price', 0)
    .addTool('btc-trend', 'WebSearchTool', 'Bitcoin price trend past 7 days', 0)
    
    // Then analyze the collected data
    .addDependentTool(
      'price-analysis',
      'AnthropicTool',
      (context) => {
        const priceData = context.getPreviousResult('btc-price')?.result || '';
        const trendData = context.getPreviousResult('btc-trend')?.result || '';
        
        return `Analyze this Bitcoin price information and provide a concise market outlook:
        
        Current Price Information:
        ${priceData.substring(0, 500)}...
        
        Recent Trend Information:
        ${trendData.substring(0, 500)}...
        
        Format your response as a brief market summary with key points and outlook.`;
      },
      ['btc-price', 'btc-trend'],
      1
    )
    .parallel(2)
    .build();
  
  // Execute the graph
  console.log("Executing tool orchestration...");
  const results = await toolOrchestrator.executeGraph(analysisGraph, agent.id);
  
  // Get the analysis result
  const analysis = results.get('price-analysis')?.result;
  console.log("\nBitcoin Market Analysis:");
  console.log(analysis);

  // Send a message to the agent
  console.log("\nSending a direct message to the agent...");
  const response = await agent.receiveMessage({
    id: `msg-${Date.now()}`,
    sender_id: 'user',
    recipient_id: agent.id,
    content: 'Based on the current market conditions, what should be my Bitcoin investment strategy?',
    timestamp: Date.now()
  });

  console.log("\nAgent Response:");
  console.log(response.content);
}

// Run the example
main().catch(console.error);