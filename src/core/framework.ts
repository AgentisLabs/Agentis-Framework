import { Agent } from '../agents/Agent';
import { AgentConfig } from '../types/agent-config';
import { WebSearchTool } from '../tools/WebSearchTool';
import { OpenRouterTool } from '../tools/OpenRouterTool';
import { AgentRuntime } from '../runtime/AgentRuntime';

const testAgentConfig: AgentConfig = {
  id: 'test-agent-1',
  name: 'TestAgent',
  lore: 'I am a test agent for the Agentis Framework',
  role: 'Tester',
  goals: ['Test the framework'],
  tools: [new WebSearchTool(), new OpenRouterTool()]
};

export async function initializeFramework() {
  const runtime = new AgentRuntime();
  runtime.registerAgent(new Agent(
    testAgentConfig.id,
    testAgentConfig.name,
    testAgentConfig.lore,
    testAgentConfig.role,
    testAgentConfig.goals,
    testAgentConfig.tools
  ));
  await runtime.start();
  return runtime;
} 