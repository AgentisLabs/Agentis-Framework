import { AgentFactory } from '../agents/AgentFactory';
import { AgentMessage } from '../agents/AgentMessage';
import { AgentRuntime } from '../runtime/AgentRuntime';
import { createInterface, Interface } from 'readline';
import { OpenRouterTool } from '../tools/OpenRouterTool';
import { WebSearchTool } from '../tools/WebSearchTool';
import { getTeam } from '../config/framework-config';
import { IAgent } from '../agents/IAgent';

console.log('Environment check:', {
  hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
  url: process.env.NEXT_PUBLIC_URL
});

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

  // Test messages
  const researchMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender_id: 'user-1',
    recipient_id: agents[0].id,
    content: "What are some promising low-cap AI agent cryptocurrencies?",
    timestamp: Date.now()
  };

  console.log("\n🟦 User to Research Agent:", researchMessage.content);
  const researchResponse = await agents[0].receiveMessage(researchMessage);
  console.log("🤖 Research Agent:", researchResponse.content);

  // Send research findings to technical analyst
  const technicalMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    sender_id: 'user-1',
    recipient_id: agents[1].id,
    content: `Based on this research: ${researchResponse.content}\nCan you provide a technical analysis of the most promising one?`,
    timestamp: Date.now()
  };

  console.log("\n🟦 User to Technical Agent:", technicalMessage.content);
  const technicalResponse = await agents[1].receiveMessage(technicalMessage);
  console.log("🤖 Technical Agent:", technicalResponse.content);
}

// Run the test
main().catch(console.error); 