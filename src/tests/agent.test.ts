import { AgentFactory } from '../agents/AgentFactory';
import { testAgentConfig } from '../config/test-agent';
import { AgentMessage } from '../agents/AgentMessage';
import { IAgent } from '../agents/IAgent';

describe('Crypto Agent Tests', () => {
  let agent: IAgent;

  beforeEach(async () => {
    agent = await AgentFactory.createAgent(testAgentConfig);
  });

  test('Agent should process market analysis request', async () => {
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      sender_id: 'test-user',
      recipient_id: agent.id,
      content: 'Analyze the current Bitcoin market trend',
      timestamp: Date.now()
    };

    const response = await agent.receiveMessage(message);
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(response.sender_id).toBe(agent.id);
    expect(response.recipient_id).toBe(message.sender_id);
  }, 10000);

  test('Agent should generate tasks for market scanning', async () => {
    const tasks = await agent.generateTasks?.('Scan crypto market');
    expect(tasks).toBeDefined();
    expect(Array.isArray(tasks)).toBe(true);
  });
}); 