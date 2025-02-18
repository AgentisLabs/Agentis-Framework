import { AgentFactory } from '../agents/AgentFactory';
import { AgentMessage } from '../agents/AgentMessage';
import { AgentRuntime } from '../runtime/AgentRuntime';
import { createInterface, Interface } from 'readline';
import { OpenRouterTool } from '../tools/OpenRouterTool';
import { WebSearchTool } from '../tools/WebSearchTool';

console.log('Environment check:', {
  hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
  url: process.env.NEXT_PUBLIC_URL
});

async function main() {
  const runtime = new AgentRuntime();

  // Create Market Research Agent
  const researchAgent = await AgentFactory.createAgent({
    id: 'market-researcher-1',
    name: 'MarketScout',
    lore: 'I am a crypto market researcher specializing in discovering promising cryptocurrency projects. I focus on fundamentals, team analysis, and market potential.',
    role: 'Market Researcher',
    goals: [
      'Discover promising crypto projects',
      'Analyze project fundamentals',
      'Evaluate market potential'
    ],
    tools: [new WebSearchTool(), new OpenRouterTool()]
  });

  // Create Technical Analysis Agent
  const technicalAgent = await AgentFactory.createAgent({
    id: 'technical-analyst-1',
    name: 'TechAnalyst',
    lore: 'I am a technical analysis expert focusing on cryptocurrency price patterns, volume analysis, and market trends. I specialize in identifying strong technical setups.',
    role: 'Technical Analyst',
    goals: [
      'Analyze price patterns',
      'Evaluate trading volumes',
      'Identify technical strength'
    ],
    tools: [new WebSearchTool(), new OpenRouterTool()]
  });

  // Register both agents
  runtime.registerAgent(researchAgent);
  runtime.registerAgent(technicalAgent);
  await runtime.start();

  // Function to coordinate agents
  async function coordinateAgents(query: string): Promise<void> {
    // First agent researches potential coins
    const researchMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      sender_id: 'user-1',
      recipient_id: researchAgent.id,
      content: `Find promising cryptocurrency projects based on: ${query}. Focus on fundamentals and market potential.`,
      timestamp: Date.now()
    };

    console.log('\nUser to MarketScout:', researchMessage.content);
    const researchResponse = await researchAgent.receiveMessage(researchMessage);
    console.log(`\nMarketScout:`, researchResponse.content);

    // Second agent analyzes technical aspects
    const technicalMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      sender_id: researchAgent.id,
      recipient_id: technicalAgent.id,
      content: `Analyze the technical strength of these projects: ${researchResponse.content}`,
      timestamp: Date.now()
    };

    console.log('\nMarketScout to TechAnalyst:', technicalMessage.content);
    const technicalResponse = await technicalAgent.receiveMessage(technicalMessage);
    console.log(`\nTechAnalyst:`, technicalResponse.content);
  }

  // Interactive chat loop
  const readline: Interface = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\nMulti-Agent Crypto Analysis System. Type "exit" to end.\n');
  console.log('Example query: "Find 10 promising low-cap cryptocurrencies with strong fundamentals"\n');

  const askQuestion = () => {
    readline.question('Your query: ', async (query) => {
      if (query.toLowerCase() === 'exit') {
        readline.close();
        process.exit(0);
      }

      await coordinateAgents(query);
      askQuestion();
    });
  };

  askQuestion();
}

main().catch(console.error); 