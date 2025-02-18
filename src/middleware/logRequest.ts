import { AgentMessage } from '../agents/AgentMessage';
import { IAgent } from '../agents/IAgent';
import { Logger, LogType } from '../logs/Logger';

export const logRequest = async (
  message: AgentMessage,
  agent: IAgent,
  next: () => Promise<void>
) => {
  // Log the incoming request
  await Logger.log(agent.id, LogType.MESSAGE, {
    event: 'api_request',
    message: {
      id: message.id,
      sender_id: message.sender_id,
      recipient_id: message.recipient_id,
      timestamp: message.timestamp
    }
  });

  try {
    await next();
    
    // Log successful completion
    await Logger.log(agent.id, LogType.STATUS_UPDATE, {
      event: 'api_request_complete',
      message_id: message.id
    });
  } catch (error) {
    // Log error
    await Logger.log(agent.id, LogType.ERROR, {
      event: 'api_request_error',
      message_id: message.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}; 