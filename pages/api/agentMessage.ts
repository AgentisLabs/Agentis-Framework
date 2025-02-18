// pages/api/agentMessage.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { AgentMessage } from '../../src/agents/AgentMessage';
import { MiddlewareChain } from '../../src/middleware/AgentMiddleware';
import { rateLimit } from '../../src/middleware/rateLimit';
import { logRequest } from '../../src/middleware/logRequest';
import { AgentFactory } from '../../src/agents/AgentFactory';

// Initialize middleware chain
const middlewareChain = new MiddlewareChain()
  .use(rateLimit)
  .use(logRequest);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const message: AgentMessage = req.body;
    const { agentConfig = 'crypto-analyst' } = req.query;

    const agent = await AgentFactory.createAgent(agentConfig as string);
    await middlewareChain.execute(message, agent);
    
    // Process message and get response
    const response = await agent.receiveMessage(message);
    
    // Handle task generation if scan requested
    if (message.content.toLowerCase().includes('scan')) {
      const tasks = await agent.generateTasks?.('Scan crypto market');
      if (tasks) {
        const results = await Promise.all(
          tasks.map(task => agent.executeTask(task))
        );
        return res.status(200).json({ 
          status: 'Tasks completed',
          response,
          results 
        });
      }
    }

    return res.status(200).json({ 
      status: 'Message processed',
      response 
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
