import { AgentFactory } from '../agents/AgentFactory';
import { AgentMessage } from '../agents/AgentMessage';
import { AgentRuntime } from '../runtime/AgentRuntime';
import { createInterface } from 'readline';
import { OpenRouterTool } from '../tools/OpenRouterTool';
import { WebSearchTool } from '../tools/WebSearchTool';
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
  
  // Get team configuration and create agent instances
  const researchTeamConfig = getTeam('cryptoResearch');
  const agents: IAgent[] = [];
  
  // Create agent instances from configs
  for (const config of researchTeamConfig) {
    const agent = await AgentFactory.createAgent(config);
    agents.push(agent);
    runtime.registerAgent(agent);
  }
  
  await runtime.start();

  console.log("\n🤖 Crypto Research Team Ready!");
  console.log("Team Members:");
  console.log("1. Market Researcher (Deep Research)");
  console.log("2. Technical Analyst (Market Analysis)");
  console.log("3. Strategy Master (Coordination)\n");

  // Get user input for the research task
  const userTask = await askQuestion("Enter your research task: ");

  // First, let the goal planner create a structured research plan
  const plannerMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender_id: 'user-1',
    recipient_id: agents[2].id, // Goal Planner
    content: `Create a focused research plan for: ${userTask}. 
    Break down what specific aspects the Market Researcher should investigate (tokenomics, team, technology, etc.) 
    and what the Technical Analyst should analyze (price action, volume, market structure, etc.).`,
    timestamp: Date.now()
  };

  console.log("\n🎯 Strategy Master creating research plan...");
  const planningResponse = await agents[2].receiveMessage(plannerMessage);
  
  // Research phase with specific directives
  const researchMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender_id: agents[2].id,
    recipient_id: agents[0].id,
    content: `Conduct detailed research on ${userTask}. Focus on:
    1. Project Overview & Technology
    2. Team Background & Credibility
    3. Tokenomics & Distribution
    4. Recent Developments & News
    5. Market Position & Competitors
    
    Research Plan Context: ${planningResponse.content}
    
    Please provide specific, factual information about ${userTask}, not generic responses.`,
    timestamp: Date.now()
  };

  console.log("\n📚 Market Researcher investigating...");
  const researchResponse = await agents[0].receiveMessage(researchMessage);
  console.log("🔍 Research Findings:", researchResponse.content);

  // Technical analysis phase with specific focus areas
  const technicalMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender_id: agents[2].id,
    recipient_id: agents[1].id,
    content: `Analyze the market metrics for ${userTask}. Focus on:
    1. Current Price & Market Cap
    2. Volume Analysis & Trends
    3. Key Support/Resistance Levels
    4. Market Structure & Patterns
    5. Liquidity Analysis
    
    Research Context: ${researchResponse.content}
    
    Please provide specific technical analysis for ${userTask}, including concrete data points and metrics.`,
    timestamp: Date.now()
  };

  console.log("\n📊 Technical Analyst processing...");
  const technicalResponse = await agents[1].receiveMessage(technicalMessage);
  console.log("📈 Technical Analysis:", technicalResponse.content);

  // Final synthesis with concrete recommendations
  const synthesisMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender_id: 'user-1',
    recipient_id: agents[2].id,
    content: `Synthesize a final analysis for ${userTask}:
    1. Summarize key findings from both research and technical analysis
    2. Identify specific strengths and risks
    3. Provide actionable insights and recommendations
    
    Research: ${researchResponse.content}
    Technical Analysis: ${technicalResponse.content}`,
    timestamp: Date.now()
  };

  console.log("\n🎯 Strategy Master synthesizing final insights...");
  const finalResponse = await agents[2].receiveMessage(synthesisMessage);
  console.log("\n🔮 Final Analysis:", finalResponse.content);

  // Close readline interface
  readline.close();
}

// Run the interactive session
main().catch(console.error); 