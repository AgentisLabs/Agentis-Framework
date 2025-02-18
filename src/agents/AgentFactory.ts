import { IAgent } from './IAgent';
import { Agent } from './Agent';
import { ITool } from '../tools/ITool';

interface AgentConfig {
  id: string;
  name: string;
  lore: string;
  role: string;
  goals: string[];
  tools?: ITool[];
}

export class AgentFactory {
  static async createAgent(config: AgentConfig): Promise<IAgent> {
    // Create the agent with the provided tools or an empty array
    const tools = config.tools || [];
    
    const agent = new Agent(
      config.id,
      config.name,
      config.lore,
      config.role,
      config.goals,
      tools
    ) as IAgent;  // Explicitly cast to IAgent to ensure interface compliance

    // Initialize the agent's memory
    await agent.initializeMemory();

    // Verify that the agent implements all required properties
    if (!agent.tools) {
      agent.tools = tools;  // Ensure tools are set if not already
    }

    return agent;
  }
} 