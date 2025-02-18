import { AgentFactory } from '../src/agents/AgentFactory';
import { testAgentConfig } from '../src/config/test-agent';

async function runTest() {
  try {
    const agent = await AgentFactory.createAgent(testAgentConfig);
    
    const message = {
      id: `msg-${Date.now()}`,
      sender_id: 'test-user',
      recipient_id: agent.id,
      content: 'Please analyze the current Bitcoin market conditions and provide insights.',
      timestamp: Date.now()
    };

    console.log('Sending message to agent...');
    await agent.receiveMessage(message);
    
    const tasks = await agent.generateTasks('Analyze BTC market');
    console.log('Generated tasks:', tasks);
    
    for (const task of tasks) {
      console.log(`Executing task: ${task.description}`);
      await agent.executeTask(task);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest(); 