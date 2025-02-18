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
  console.log("1. Market Researcher");
  console.log("2. Technical Analyst");
  console.log("3. Goal Planner\n");

  // Get user input for the research task
  const userTask = await askQuestion("Enter your research task: ");

  // Research phase
  const researchMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender_id: 'user-1',
    recipient_id: agents[0].id,
    content: userTask,
    timestamp: Date.now()
  };

  console.log("\n🟦 User to Research Agent:", researchMessage.content);
  const researchResponse = await agents[0].receiveMessage(researchMessage);
  console.log("🤖 Research Agent:", researchResponse.content);

  // Get user input for technical analysis focus
  const technicalFocus = await askQuestion("\nWhat aspect would you like the Technical Analyst to focus on? ");

  // Technical analysis phase
  const technicalMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender_id: 'user-1',
    recipient_id: agents[1].id,
    content: `Based on this research: ${researchResponse.content}\n${technicalFocus}`,
    timestamp: Date.now()
  };

  console.log("\n🟦 User to Technical Agent:", technicalMessage.content);
  const technicalResponse = await agents[1].receiveMessage(technicalMessage);
  console.log("🤖 Technical Agent:", technicalResponse.content);

  // Close readline interface
  readline.close();
}

// Run the interactive session
main().catch(console.error); 